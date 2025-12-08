import * as asn1js from 'asn1js'
import { createHash, randomBytes, subtle } from 'crypto'
import { addYears } from 'date-fns'
import { exportJWK } from 'jose'
import * as pkijs from 'pkijs'
import { invariant } from './invariant'
import { Lazy } from './lazy'

const cryptoEngine = Lazy(() => {
  pkijs.setEngine('node', new pkijs.CryptoEngine({ name: 'node', crypto: crypto }))
  return pkijs.getCrypto(true)
})

/*
 * Convert a PEM-encoded certificate to the version used in the x5c element
 * of a [JSON Web Key](http://tools.ietf.org/html/draft-ietf-jose-json-web-key).
 *
 * `cert` PEM-encoded certificate chain
 * `maxDepth` The maximum number of certificates to use from the chain.
 */
function convertPemCertToX5c(cert: string, maxDepth: number = 0) {
  cert = cert.replace(/-----[^\n]+\n?/gm, ',').replace(/\n/g, '')
  let certs = cert.split(',').filter(function (c) {
    return c.length > 0
  })
  if (maxDepth > 0) {
    certs = certs.splice(0, maxDepth)
  }
  return certs
}

export async function createJwkWithX5c({
  alg,
  keyUsages,
  subject,
  domains = [],
}: {
  alg: 'RSA-PSS' | 'ECDH' | 'ECDSA'
  keyUsages: KeyUsage[]
  subject: {
    commonName: string
    organization?: string
    country?: string
    location?: string
    state?: string
  }
  domains?: string[]
}) {
  const engine = cryptoEngine()
  const now = new Date() // Snapshot of the current time
  const extractable = true // Extractable is required to export the private key as a JWK
  const algName = alg
  const algNamedCurve = alg === 'RSA-PSS' ? undefined : 'P-256'

  // validate keyUsages matches alg
  const validKeyUsagesForAlg: Record<typeof alg, KeyUsage[]> = {
    'RSA-PSS': ['sign', 'verify'],
    ECDSA: ['sign', 'verify'],
    ECDH: ['deriveKey', 'deriveBits'],
  }
  const validUsages = validKeyUsagesForAlg[alg]
  const invalidUsages = keyUsages.filter((usage) => !validUsages.includes(usage))
  invariant(keyUsages.length > 0, 'At least one key usage must be specified')
  invariant(
    invalidUsages.length === 0,
    `Invalid key usages for algorithm ${alg}: ${invalidUsages.join(', ')}. Valid usages: ${validUsages.join(', ')}`,
  )

  const { publicKey, privateKey } = await subtle.generateKey(
    {
      name: algName,
      namedCurve: algNamedCurve,
      // 256-bit hash at 50% output gives 2^128 hashes before collision (https://en.wikipedia.org/wiki/Birthday_attack)
      hash: 'SHA-256',
      // The public exponent is a Fermat prime (2^2^n + 1) where n is a non-negative integer. (https://en.wikipedia.org/wiki/Fermat_number#Primality)
      // The fourth Fermat number 2^16 + 1 = 65537 is the most common value for the public exponent, as it offers a balance between security and performance.
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      // https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/ism/cyber-security-guidelines/guidelines-cryptography
      // A modulus of 2048 bits for correctly implemented RSA provides 112 bits of effective security strength. Taking into account projected technological advances,
      // it is assessed that 112 bits of effective security strength will remain secure until 2030.
      // We're using 4096 bits to be extra safe, whilst not going overboard or causing performance issues.
      modulusLength: 4096,
    },
    extractable,
    keyUsages,
  )

  // Create a Certificate object & set certificate fields (Ref: https://www.rfc-editor.org/rfc/rfc5280#section-4.1.2.2)
  const certificate = new pkijs.Certificate()
  // This field describes the version of the encoded certificate.
  // The latest version is 3, which includes support for extension.
  certificate.version = 2 // Zero-based index
  // The serial number MUST be a positive integer assigned by the CA to each certificate.
  // Certificate users MUST be able to handle serialNumber values up to 20 octets.
  // Conforming CAs MUST NOT use serialNumber values longer than 20 octets.
  // Max number=2^160-1 (2^(20*8)-1), Max number returned by getTime() is 2^53-1 (Number.MAX_SAFE_INTEGER)
  // So, we can safely use the current time in milliseconds as the serial number.
  certificate.serialNumber = new asn1js.Integer({ value: now.getTime() })
  // Both notBefore and notAfter may be encoded as UTCTime or GeneralizedTime.
  certificate.notBefore.value = now
  // The certificate is valid for 1 year
  certificate.notAfter.value = addYears(now, 1)

  // Type refs: https://learn.microsoft.com/en-us/windows/win32/seccrypto/name-properties
  const names = [
    // Common name
    new pkijs.AttributeTypeAndValue({
      type: '2.5.4.3',
      value: new asn1js.Utf8String({ value: subject.commonName }),
    }),
    // Organization
    new pkijs.AttributeTypeAndValue({
      type: '2.5.4.10',
      value: new asn1js.Utf8String({ value: subject.organization || 'VO' }),
    }),
    // Country
    new pkijs.AttributeTypeAndValue({
      type: '2.5.4.6',
      value: new asn1js.PrintableString({ value: subject.country || 'AU' }),
    }),
    // Location
    new pkijs.AttributeTypeAndValue({
      type: '2.5.4.7',
      value: new asn1js.Utf8String({ value: subject.location || 'Sydney' }),
    }),
    // State or Province
    new pkijs.AttributeTypeAndValue({
      type: '2.5.4.8',
      value: new asn1js.Utf8String({ value: subject.state || 'NSW' }),
    }),
  ]
  certificate.subject.typesAndValues = names
  certificate.issuer.typesAndValues = names

  // Import the public key into the certificate, so we can sign it
  await certificate.subjectPublicKeyInfo.importKey(publicKey)

  certificate.extensions = []

  // 1. Key Usage Extension (critical)
  // Defines what the certificate key can be used for
  // RFC 5280 Section 4.2.1.3: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.3
  // Bit positions: digitalSignature(0)=0x80, nonRepudiation(1)=0x40, keyEncipherment(2)=0x20,
  //                dataEncipherment(3)=0x10, keyAgreement(4)=0x08, keyCertSign(5)=0x04,
  //                cRLSign(6)=0x02, encipherOnly(7)=0x01, decipherOnly(8)=0x0080
  let keyUsageBits = 0x00

  // For signing operations (sign/verify), set digitalSignature bit
  if (keyUsages.includes('sign') || keyUsages.includes('verify')) {
    keyUsageBits |= 0x80 // digitalSignature (bit 0)
  }

  // For key agreement operations (ECDH), set keyAgreement bit
  if (keyUsages.includes('deriveKey') || keyUsages.includes('deriveBits')) {
    keyUsageBits |= 0x08 // keyAgreement (bit 4)
  }

  const keyUsageExtension = new pkijs.Extension({
    extnID: '2.5.29.15', // id-ce-keyUsage
    critical: true,
    extnValue: new asn1js.BitString({
      valueHex: new Uint8Array([keyUsageBits]).buffer,
    }).toBER(false),
  })
  certificate.extensions.push(keyUsageExtension)

  // 2. Basic Constraints
  // RFC 5280 Section 4.2.1.9: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.9
  // Identifies whether the certificate is a CA certificate or an end entity certificate
  // - For CA certificates: cA MUST be TRUE and extension MUST be marked critical
  // - For end entity certificates: cA is FALSE and extension SHOULD be non-critical
  // Note: Red Hat PKIX recommends omitting this extension entirely for end-entity certs,
  // but RFC 5280 says it SHOULD be present, so we include it as non-critical
  const basicConstraints = new pkijs.Extension({
    extnID: '2.5.29.19', // id-ce-basicConstraints
    critical: false, // Non-critical for end entity certificates per RFC 5280
    extnValue: new pkijs.BasicConstraints({
      cA: false, // Not a CA certificate - this is an end entity certificate
    })
      .toSchema()
      .toBER(false),
  })
  certificate.extensions.push(basicConstraints)

  // 3. Subject Alternative Name
  // RFC 5280 Section 4.2.1.6: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.6
  // Binds additional identities (DNS names, email addresses, IP addresses, URIs) to the subject
  // GeneralName types: otherName(0), rfc822Name(1), dNSName(2), x400Address(3),
  //                    directoryName(4), ediPartyName(5), uniformResourceIdentifier(6),
  //                    iPAddress(7), registeredID(8)
  // Critical requirement: MUST be critical if subject field contains an empty sequence
  // Since we always populate the subject DN with commonName, this can be non-critical
  if (domains.length > 0) {
    const subjectAltName = new pkijs.Extension({
      extnID: '2.5.29.17', // id-ce-subjectAltName
      critical: false, // Non-critical when subject DN is populated
      extnValue: new pkijs.GeneralNames({
        names: domains.map((d) => new pkijs.GeneralName({ type: 2, value: d })), // type 2 = dNSName
      })
        .toSchema()
        .toBER(false),
    })
    certificate.extensions.push(subjectAltName)
  }

  // 4. Subject Key Identifier (SKI)
  // RFC 5280 Section 4.2.1.2: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.2
  // Uniquely identifies the certificate's public key
  // Computed as SHA-1 hash of the BIT STRING subjectPublicKey (method 1)
  // Note: Hash only the key bits, not the entire SubjectPublicKeyInfo structure
  const publicKeyBitString = certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView
  const publicKeyHash = createHash('sha1').update(publicKeyBitString).digest()
  const skiExtension = new pkijs.Extension({
    extnID: '2.5.29.14', // id-ce-subjectKeyIdentifier
    critical: false,
    extnValue: new asn1js.OctetString({ valueHex: publicKeyHash }).toBER(false),
  })
  certificate.extensions.push(skiExtension)

  // 5. Authority Key Identifier (AKI)
  // RFC 5280 Section 4.2.1.1: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.1
  // Identifies the public key corresponding to the private key that signed this certificate
  // Structure: AuthorityKeyIdentifier ::= SEQUENCE {
  //   keyIdentifier             [0] KeyIdentifier           OPTIONAL,
  //   authorityCertIssuer       [1] GeneralNames            OPTIONAL,
  //   authorityCertSerialNumber [2] CertificateSerialNumber OPTIONAL }
  // MUST be included in all CA certificates. MAY be omitted for self-signed certificates.
  // For self-signed certificates, keyIdentifier is the same as the Subject Key Identifier
  const akiExtension = new pkijs.Extension({
    extnID: '2.5.29.35', // id-ce-authorityKeyIdentifier
    critical: false, // MUST be non-critical per RFC 5280
    extnValue: new pkijs.AuthorityKeyIdentifier({
      keyIdentifier: new asn1js.OctetString({ valueHex: publicKeyHash }),
    })
      .toSchema()
      .toBER(false),
  })
  certificate.extensions.push(akiExtension)

  // 6. Issuer Alternative Name (optional)
  // RFC 5280 Section 4.2.1.7: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.7
  // Associates Internet-style identities (DNS names, email addresses, URIs, IP addresses) with the certificate issuer
  // Structure: IssuerAltName ::= GeneralNames (same encoding as SubjectAltName per 4.2.1.6)
  // Critical requirement: CAs SHOULD mark as non-critical
  // Processing note: Not processed during certification path validation, not used in name chaining
  // For self-signed certificates, issuer = subject, so this mirrors the Subject Alternative Name
  if (domains.length > 0) {
    const issuerAltName = new pkijs.Extension({
      extnID: '2.5.29.18', // id-ce-issuerAltName
      critical: false, // Non-critical per RFC 5280 recommendation
      extnValue: new pkijs.GeneralNames({
        names: domains.map((d) => new pkijs.GeneralName({ type: 2, value: d })), // type 2 = dNSName
      })
        .toSchema()
        .toBER(false),
    })
    certificate.extensions.push(issuerAltName)
  }

  // Sign the certificate using the private key
  await certificate.sign(privateKey, 'SHA-256', engine)

  // Export the certificate to PEM format
  const certBuffer = certificate.toSchema(true).toBER(false)
  const pemCert = `-----BEGIN CERTIFICATE-----\n${Buffer.from(certBuffer).toString('base64')}\n-----END CERTIFICATE-----`

  const jwk = await exportJWK(privateKey)
  // Add the certificate chain to the JWK
  jwk.x5c = convertPemCertToX5c(pemCert)

  // Attach JOSE hints
  jwk.kid = `enc-${Date.now()}-${randomBytes(8).toString('hex')}`
  jwk.use = keyUsages.includes('sign') ? 'sig' : 'enc'
  jwk.alg = alg === 'RSA-PSS' ? 'PS256' : alg === 'ECDSA' ? 'ES256' : 'ECDH-ES+A256KW'

  return { jwk, privateKey, publicKey, pemCert }
}

/**
 * Compute the x509_hash client identifier from a PEM certificate.
 * Returns the base64url-encoded SHA-256 hash of the DER-encoded X.509 certificate.
 * Spec: https://openid.net/specs/openid-4-verifiable-presentations-1_0-final.html#section-5.9.3
 */
export function computeX509Hash(pemCert: string): string {
  // Extract the base64 certificate data (remove PEM headers/footers)
  const certBase64 = pemCert
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\n/g, '')

  // Convert base64 to DER-encoded binary
  const derCert = Buffer.from(certBase64, 'base64')

  // Compute SHA-256 hash and return as base64url
  // Use Uint8Array to satisfy type checking
  return createHash('sha256').update(new Uint8Array(derCert)).digest('base64url')
}

export function getCertificateAttribute(typesAndValues: pkijs.AttributeTypeAndValue[], oid: string): string | undefined {
  const attr = typesAndValues.find((item) => item.type === oid)
  if (!attr) return undefined

  const valueBlock = attr.value.valueBlock as { value?: string }
  return valueBlock.value
}

export function isPem(certBytes: Uint8Array): boolean {
  const isPem =
    certBytes.length > 10 &&
    certBytes[1] === 0x2d && // '-'
    certBytes[2] === 0x2d && // '-'
    certBytes[0] === 0x2d && // '-'
    certBytes[3] === 0x2d && // '-'
    certBytes[4] === 0x2d && // '-'
    certBytes[5] === 0x42 && // 'B'
    certBytes[6] === 0x45 && // 'E'
    certBytes[7] === 0x47 && // 'G'
    certBytes[8] === 0x49 && // 'I'
    certBytes[9] === 0x4e // 'N'
  return isPem
}

export function pemToDer(pemCert: string): Uint8Array {
  const base64 = pemCert
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '')

  return new Uint8Array(Buffer.from(base64, 'base64'))
}

export function derToPem(derCert: Uint8Array): string {
  const base64 = Buffer.from(derCert).toString('base64')
  const lines = base64.match(/.{1,64}/g) || []
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`
}

export function getSubjectString(cert: pkijs.Certificate): string {
  const attrs = cert.subject.typesAndValues
  const cn = getCertificateAttribute(attrs, '2.5.4.3') // Common Name
  const c = getCertificateAttribute(attrs, '2.5.4.6') // Country
  const st = getCertificateAttribute(attrs, '2.5.4.8') // State/Province
  const o = getCertificateAttribute(attrs, '2.5.4.10') // Organization

  const parts = []
  if (cn) parts.push(`CN=${cn}`)
  if (o) parts.push(`O=${o}`)
  if (st) parts.push(`ST=${st}`)
  if (c) parts.push(`C=${c}`)

  return parts.join(', ') || 'Unknown'
}

export function getIssuerString(cert: pkijs.Certificate): string {
  const attrs = cert.issuer.typesAndValues
  const cn = getCertificateAttribute(attrs, '2.5.4.3') // Common Name
  const c = getCertificateAttribute(attrs, '2.5.4.6') // Country
  const o = getCertificateAttribute(attrs, '2.5.4.10') // Organization

  const parts = []
  if (cn) parts.push(`CN=${cn}`)
  if (o) parts.push(`O=${o}`)
  if (c) parts.push(`C=${c}`)

  return parts.join(', ') || 'Unknown'
}

export function isSelfSigned(cert: pkijs.Certificate): boolean {
  // A certificate is self-signed if issuer equals subject
  const issuerStr = getIssuerString(cert)
  const subjectStr = getSubjectString(cert)
  return issuerStr === subjectStr
}
