import * as asn1js from 'asn1js'
import * as pkijs from 'pkijs'
import { logger } from '../../../logger'
import { getCertificateAttribute, getIssuerString, getSubjectString } from '../../../util/cryptography'
import { invariant } from '../../../util/invariant'

/**
 * X.509 Certificate Extension OIDs (RFC 5280)
 */
const X509_EXTENSION_OID = {
  subjectKeyIdentifier: '2.5.29.14',
  keyUsage: '2.5.29.15',
  basicConstraints: '2.5.29.19',
  crlDistributionPoints: '2.5.29.31',
  authorityKeyIdentifier: '2.5.29.35',
} as const

/**
 * Key Usage bit positions (RFC 5280 Section 4.2.1.3)
 */
const KEY_USAGE_BIT_MASKS: Record<string, number> = {
  digitalSignature: 0x80, // bit 0
  nonRepudiation: 0x40, // bit 1
  keyEncipherment: 0x20, // bit 2
  dataEncipherment: 0x10, // bit 3
  keyAgreement: 0x08, // bit 4
  keyCertSign: 0x04, // bit 5
  cRLSign: 0x02, // bit 6
  encipherOnly: 0x01, // bit 7
}

/**
 * Parses a DER-encoded X.509 certificate
 */
function parseCertificate(certBytes: Uint8Array): pkijs.Certificate {
  const buffer = certBytes.buffer
  const arrayBuffer =
    buffer instanceof ArrayBuffer
      ? buffer.slice(certBytes.byteOffset, certBytes.byteOffset + certBytes.byteLength)
      : new Uint8Array(certBytes).buffer
  const asn1 = asn1js.fromBER(arrayBuffer)
  invariant(asn1.offset !== -1, 'Failed to parse certificate: ASN.1 decoding error')
  return new pkijs.Certificate({ schema: asn1.result })
}

/**
 * Validates Key Usage extension according to ISO 18013-5 Annex B
 * IACA certificates must have keyCertSign and cRLSign
 * DS (Document Signer) certificates must have digitalSignature
 */
function validateKeyUsage(cert: pkijs.Certificate, expectedUsages: string[], certType: 'IACA' | 'DS'): void {
  const keyUsageExt = cert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.keyUsage)
  invariant(keyUsageExt, `${certType} certificate is missing Key Usage extension`)

  // Parse the BitString from the extension value
  const asn1 = asn1js.fromBER(keyUsageExt.extnValue.valueBlock.valueHexView.slice().buffer)
  invariant(asn1.offset !== -1, 'Failed to parse Key Usage extension')

  const bitString = asn1.result as asn1js.BitString
  const keyUsageBits = bitString.valueBlock.valueHexView[0] || 0

  for (const usage of expectedUsages) {
    const bitMask = KEY_USAGE_BIT_MASKS[usage]
    invariant(bitMask !== undefined, `Unknown key usage: ${usage}`)
    invariant((keyUsageBits & bitMask) !== 0, `${certType} certificate missing required key usage: ${usage}`)
  }
}

/**
 * Validates Basic Constraints extension according to ISO 18013-5 Annex B
 * CA certificates (IACA) must have the CA flag set
 * End-entity certificates (DS) must not have the CA flag set
 */
function validateBasicConstraints(cert: pkijs.Certificate, shouldBeCA: boolean, certType: string): void {
  const basicConstraintsExt = cert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.basicConstraints)
  invariant(basicConstraintsExt, `${certType} certificate is missing Basic Constraints extension`)

  // Parse BasicConstraints from the extension value
  const asn1Result = asn1js.fromBER(basicConstraintsExt.extnValue.valueBlock.valueHexView.slice().buffer)
  invariant(asn1Result.offset !== -1, 'Failed to parse Basic Constraints extension')

  const basicConstraints = new pkijs.BasicConstraints({ schema: asn1Result.result })
  const isCA = basicConstraints.cA || false

  if (shouldBeCA) {
    invariant(isCA, `${certType} certificate must have CA flag set in Basic Constraints`)
  } else {
    invariant(!isCA, `${certType} certificate must not have CA flag set in Basic Constraints`)
  }
}

/**
 * Validates Authority Key Identifier matches Subject Key Identifier
 * According to ISO 18013-5 Annex B, the AKI in the subject cert should match
 * the SKI in the issuer cert to ensure proper chain linkage
 */
function validateKeyIdentifiers(issuerCert: pkijs.Certificate, subjectCert: pkijs.Certificate): void {
  const subjectKeyIdExt = issuerCert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.subjectKeyIdentifier)
  const authorityKeyIdExt = subjectCert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.authorityKeyIdentifier)

  // If both are present, they should match
  if (subjectKeyIdExt && authorityKeyIdExt) {
    // Parse Subject Key Identifier - it's an OCTET STRING containing the key identifier
    const skiAsn1 = asn1js.fromBER(subjectKeyIdExt.extnValue.valueBlock.valueHexView.slice().buffer)
    invariant(skiAsn1.offset !== -1, 'Failed to parse Subject Key Identifier extension')
    const skiOctetString = skiAsn1.result as asn1js.OctetString
    const subjectKeyBytes = new Uint8Array(skiOctetString.valueBlock.valueHexView)

    // Parse Authority Key Identifier
    const akiAsn1 = asn1js.fromBER(authorityKeyIdExt.extnValue.valueBlock.valueHexView.slice().buffer)
    invariant(akiAsn1.offset !== -1, 'Failed to parse Authority Key Identifier extension')
    const authorityKeyId = new pkijs.AuthorityKeyIdentifier({ schema: akiAsn1.result })

    if (authorityKeyId.keyIdentifier) {
      const authorityKeyBytes = new Uint8Array(authorityKeyId.keyIdentifier.valueBlock.valueHexView)

      // Compare the key identifiers
      const subjectKeyHex = Buffer.from(subjectKeyBytes).toString('hex')
      const authorityKeyHex = Buffer.from(authorityKeyBytes).toString('hex')

      invariant(
        subjectKeyHex === authorityKeyHex,
        `Authority Key Identifier in subject certificate (${authorityKeyHex}) does not match Subject Key Identifier in issuer certificate (${subjectKeyHex})`,
      )
    }
  }
}

/**
 * Extracts CRL Distribution Points from a certificate
 * Returns URLs where CRLs can be fetched, or undefined if extension is not present
 * This is preparatory for future CRL revocation checking implementation
 */
function extractCRLDistributionPoints(cert: pkijs.Certificate): string[] | undefined {
  const crlExt = cert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.crlDistributionPoints)

  if (!crlExt) {
    return
  }

  // Parse CRL Distribution Points from the extension value
  const asn1Result = asn1js.fromBER(crlExt.extnValue.valueBlock.valueHexView.slice().buffer)
  if (asn1Result.offset === -1) {
    logger.warn('Failed to parse CRL Distribution Points extension')
    return
  }

  const crlDP = new pkijs.CRLDistributionPoints({ schema: asn1Result.result })
  const urls: string[] = []

  for (const point of crlDP.distributionPoints) {
    if (point.distributionPoint && 'values' in point.distributionPoint) {
      // distributionPoint.values is a function that returns an iterator of GeneralName objects
      const generalNames = Array.from(point.distributionPoint.values())
      for (const name of generalNames) {
        // GeneralName with type uniformResourceIdentifier (6)
        // Type guard to ensure we have the expected structure
        if (typeof name === 'object' && 'type' in name && name.type === 6 && 'value' in name && typeof name.value === 'string') {
          urls.push(name.value)
        }
      }
    }
  }

  return urls.length > 0 ? urls : undefined
}

/**
 * Validates ISO 18013-5 Annex B certificate extension requirements
 * This includes Key Usage, Basic Constraints, and Key Identifiers
 */
function validateIso18013CertificateExtensions(
  iacaCert: pkijs.Certificate,
  leafCert: pkijs.Certificate,
  {
    shouldValidateIacaExtensions = false, // Default: Don't validate trusted roots (they're already trusted)
  }: {
    shouldValidateIacaExtensions?: boolean
  } = {},
): void {
  // Optionally validate IACA certificate extensions
  // NOTE: Trusted root certificates are explicitly trusted and may not have all extensions
  // This validation is disabled by default but can be enabled for stricter checks
  if (shouldValidateIacaExtensions) {
    // Validate Basic Constraints on IACA
    const iacaBasicConstraintsExt = iacaCert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.basicConstraints)
    if (iacaBasicConstraintsExt) {
      validateBasicConstraints(iacaCert, true, 'IACA')
    } else {
      logger.debug('IACA certificate is missing Basic Constraints extension (acceptable for trusted roots)')
    }

    // Validate Key Usage on IACA
    const iacaKeyUsageExt = iacaCert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.keyUsage)
    if (iacaKeyUsageExt) {
      validateKeyUsage(iacaCert, ['keyCertSign', 'cRLSign'], 'IACA')
    } else {
      logger.debug('IACA certificate is missing Key Usage extension (acceptable for trusted roots)')
    }
  }

  // ALWAYS validate DS (Document Signer) certificate extensions per ISO 18013-5 Annex B
  // Basic Constraints is OPTIONAL for end-entity certificates per RFC 5280
  // If present, verify CA flag is not set
  const dsBasicConstraintsExt = leafCert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.basicConstraints)
  if (dsBasicConstraintsExt) {
    validateBasicConstraints(leafCert, false, 'DS')
  } else {
    logger.debug('DS certificate does not have Basic Constraints extension (acceptable per RFC 5280)')
  }

  // DS (Document Signer) certificates MUST have digitalSignature
  // This is the critical security check per ISO 18013-5 Annex B
  validateKeyUsage(leafCert, ['digitalSignature'], 'DS')

  // Validate Key Identifiers chain (if both certs have the extensions)
  const iacaHasSKI = iacaCert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.subjectKeyIdentifier)
  const leafHasAKI = leafCert.extensions?.find((ext) => ext.extnID === X509_EXTENSION_OID.authorityKeyIdentifier)

  if (iacaHasSKI && leafHasAKI) {
    validateKeyIdentifiers(iacaCert, leafCert)
  } else {
    logger.debug('Skipping key identifier validation - one or both certificates missing required extensions', {
      iacaHasSKI: !!iacaHasSKI,
      leafHasAKI: !!leafHasAKI,
    })
  }

  // Log CRL distribution points if present (for future revocation checking)
  const crlUrls = extractCRLDistributionPoints(leafCert)
  if (crlUrls && crlUrls.length > 0) {
    logger.debug('DS certificate contains CRL Distribution Points', { crlUrls })
  }
}

/**
 * Validates ISO 18013-5 specific certificate subject requirements
 * This includes country and state/province name matching between IACA and DS certificates
 */
function validateIso18013CertificateRequirements(iacaCert: pkijs.Certificate, targetCert: pkijs.Certificate): void {
  const iacaSubject = iacaCert.subject.typesAndValues
  const targetSubject = targetCert.subject.typesAndValues

  // Validate countryName (OID: 2.5.4.6) - REQUIRED
  const iacaCountry = getCertificateAttribute(iacaSubject, '2.5.4.6')
  const targetCountry = getCertificateAttribute(targetSubject, '2.5.4.6')

  invariant(iacaCountry, 'IACA certificate is missing countryName attribute')
  invariant(targetCountry, 'Target certificate is missing countryName attribute')
  invariant(iacaCountry === targetCountry, 'Country names do not match')

  // Validate stateOrProvinceName (OID: 2.5.4.8) - CONDITIONAL
  // Only required to match if present in both certificates
  const iacaState = getCertificateAttribute(iacaSubject, '2.5.4.8')
  const targetState = getCertificateAttribute(targetSubject, '2.5.4.8')
  if (!iacaState || !targetState) {
    return
  }

  invariant(iacaState, 'IACA certificate is missing stateOrProvinceName attribute')
  invariant(targetState, 'Target certificate is missing stateOrProvinceName attribute')
  invariant(iacaState === targetState, 'State or province names do not match')
}

type X509ValidationResult = {
  isValid: boolean
  certificate: pkijs.Certificate
  publicKey: CryptoKey
  details: {
    subject: string
    issuer: string
    validity: {
      notBefore: Date
      notAfter: Date
    }
    serialNumber: string
  }
}

/**
 * Validates an X.509 certificate chain according to RFC 5280 and ISO 18013-5
 */
export async function validateX509CertificateChain(
  certificateChain: Uint8Array[],
  trustedRootCerts: Uint8Array[],
  options?: {
    validationTime?: Date
  },
): Promise<X509ValidationResult> {
  invariant(certificateChain.length > 0, 'Certificate chain is empty')
  invariant(trustedRootCerts.length > 0, 'No trusted root certificates provided')

  const validationTime = options?.validationTime || new Date()

  // Parse all certificates
  const certificates = certificateChain.map((certBytes) => parseCertificate(certBytes))
  const trustedCerts = trustedRootCerts.map((certBytes) => parseCertificate(certBytes))

  invariant(trustedCerts.length > 0, 'No trusted root certificates provided')

  const leafCert = certificates[0]
  invariant(leafCert, 'Leaf certificate not found in chain')

  // Create PKI.js certificate chain validation engine
  // PKI.js expects:
  // - trustedCerts: array of trusted root CA certificates
  // - certs: array of ALL certificates to validate (including leaf and intermediates)
  const certChainEngine = new pkijs.CertificateChainValidationEngine({
    trustedCerts: trustedCerts,
    certs: certificates, // All certificates from x5chain (leaf + any intermediates, not including roots)
    checkDate: validationTime,
  })

  // Perform RFC 5280 § 6.1 basic path validation
  const verificationResult = await certChainEngine.verify()

  if (verificationResult.result === false) {
    // Extract detailed information for debugging
    const leafSubject = getSubjectString(leafCert)
    const leafIssuer = getIssuerString(leafCert)
    const leafSerialNumber = Array.from(new Uint8Array(leafCert.serialNumber.valueBlock.valueHexView))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase()

    logger.warn('X.509 certificate chain validation failed', {
      verificationResult,
      chainLength: certificates.length,
      trustedRootsCount: trustedCerts.length,
      validationTime: validationTime.toISOString(),
      leafCertificate: {
        subject: leafSubject,
        issuer: leafIssuer,
        serialNumber: leafSerialNumber,
        notBefore: leafCert.notBefore.value.toISOString(),
        notAfter: leafCert.notAfter.value.toISOString(),
      },
      certificateChain: certificates.map((cert) => ({
        subject: getSubjectString(cert),
        issuer: getIssuerString(cert),
        notBefore: cert.notBefore.value.toISOString(),
        notAfter: cert.notAfter.value.toISOString(),
      })),
      trustedRoots: trustedCerts.map((cert) => ({
        subject: getSubjectString(cert),
      })),
    })
  }

  invariant(verificationResult.result, 'Certificate chain validation failed')

  // Perform ISO 18013-5 specific validation
  // According to ISO 18013-5 § 9.3.3, we need to validate country/state matching
  // between the IACA (root CA) and ALL certificates in the chain issued under it
  //
  // The spec states:
  //   Verify that the countryName element in the subject of the IACA certificate and the countryName
  //.  element in the subject of the target certificate issued under the IACA certificate are the same.
  //
  // This means we need to validate against the IACA root, not just the immediate issuer

  // Find which trusted root was used to validate this chain
  const trustedRoot = trustedCerts.find((root) => {
    const rootSubject = getSubjectString(root)
    return certificates.some((cert) => {
      const certIssuer = getIssuerString(cert)
      return certIssuer === rootSubject
    })
  })
  invariant(trustedRoot, 'Could not determine which IACA root validated the certificate chain')

  // Validate ISO 18013-5 requirements between IACA root and leaf certificate
  validateIso18013CertificateRequirements(trustedRoot, leafCert)

  // Validate ISO 18013-5 Annex B certificate extension requirements
  validateIso18013CertificateExtensions(trustedRoot, leafCert)

  // Extract public key from leaf certificate
  const publicKey = await leafCert.getPublicKey()
  invariant(publicKey, 'Failed to extract public key from certificate')

  const serialNumberHex = Array.from(new Uint8Array(leafCert.serialNumber.valueBlock.valueHexView))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase()

  return {
    isValid: true,
    certificate: leafCert,
    publicKey,
    details: {
      subject: getSubjectString(leafCert),
      issuer: getIssuerString(leafCert),
      validity: {
        notBefore: leafCert.notBefore.value,
        notAfter: leafCert.notAfter.value,
      },
      serialNumber: serialNumberHex,
    },
  }
}

export function validateCertificateValidityForDate(cert: pkijs.Certificate, dateToCheck: Date): void {
  const notBefore = cert.notBefore.value
  const notAfter = cert.notAfter.value
  invariant(
    notBefore < dateToCheck,
    `Date ${dateToCheck.toISOString()} is before certificate validity period ` + `(notBefore: ${notBefore.toISOString()})`,
  )
  invariant(
    notAfter > dateToCheck,
    `Date ${dateToCheck.toISOString()} is after certificate validity period ` + `(notAfter: ${notAfter.toISOString()})`,
  )
}
