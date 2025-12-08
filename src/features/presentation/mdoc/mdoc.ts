import { Sign1 } from '@auth0/cose'
import { decode } from 'cbor2'
import { createHash } from 'crypto'
import type { Certificate } from 'pkijs'
import type {
  MDocCertificateValidation,
  MDocDigestValidation,
  MDocDocumentValidation,
  MDocMsoValidityInfo,
  MDocValidationResults,
} from '../../../generated/graphql'
import { derToPem } from '../../../util/cryptography'
import { invariant } from '../../../util/invariant'
import { assertExhaustive } from '../../../util/type-helpers'
import type { MDocDeviceResponse, MDocDocument, MDocIssuerSigned } from './types'
import { fetchIacaCertificates } from './verification-certs'
import { validateCertificateValidityForDate, validateX509CertificateChain } from './x509-validation'

/**
 * Mobile Security Object structure as defined in ISO18013-5 section 9.1.2.4
 */
type MobileSecurityObject = {
  version: string
  digestAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512'
  valueDigests: {
    [namespace: string]: Map<number, Uint8Array>
  }
  deviceKeyInfo: {
    deviceKey: unknown // COSE_Key structure
    keyAuthorizations?: {
      nameSpaces?: string[]
      dataElements?: {
        [namespace: string]: string[]
      }
    }
    keyInfo?: Record<number, unknown>
  }
  docType: string
  validityInfo: {
    signed: Date
    validFrom: Date
    validUntil: Date
    expectedUpdate?: Date
  }
}

/**
 * Validates an mDoc device response according to ISO18013-5 section 9.3.1
 * 1. Validate the certificate included in the MSO header according to 9.3.3.
 * 2. Verify the digital signature of the IssuerAuth structure (see 9.1.2.4) using the
 *    working_public_key, working_public_key_parameters, and working_public_key_algorithm
 *    from the certificate validation procedure of step 1.
 * 3. Calculate the digest value for every IssuerSignedItem returned in the DeviceResponse structure
 *    according to 9.1.2.5 and verify that these calculated digests equal the corresponding digest values in the MSO.
 * 4. Verify that the DocType in the MSO matches the relevant DocType in the Documents structure.
 * 5. Validate the elements in the ValidityInfo structure, i.e. verify that:
 *      — the 'signed' date is within the validity period of the certificate in the MSO header,
 *      — the current timestamp shall be equal or later than the 'validFrom' element,
 *      — the 'validUntil' element shall be equal or later than the current timestamp.
 */
export async function validateMDocResponse(
  mDocDeviceResponse: MDocDeviceResponse,
  requestedDocType: string,
  decryptedAt: Date,
): Promise<MDocValidationResults> {
  const validatedAt = new Date()

  invariant(mDocDeviceResponse.status === 0, `Device response status is not SUCCESS (status: ${mDocDeviceResponse.status})`)
  invariant(mDocDeviceResponse.documents.length > 0, 'Device response contains no documents')

  // Check for document-level errors
  if (mDocDeviceResponse.documentErrors && mDocDeviceResponse.documentErrors.length > 0) {
    const errorSummary = mDocDeviceResponse.documentErrors
      .map((err) => Object.entries(err).map(([docType, code]) => `${docType}: error code ${code}`))
      .flat()
      .join(', ')
    throw new Error(`Device response contains document errors: ${errorSummary}`)
  }

  // Validate each document and collect results
  const documentValidations: MDocDocumentValidation[] = []

  for (const document of mDocDeviceResponse.documents) {
    const validationResults = await validateDocument(document, requestedDocType)
    documentValidations.push(validationResults)
  }

  invariant(documentValidations.length > 0, 'No documents validated in response')

  // Overall validation is valid only if all documents are valid
  const isValid = documentValidations.every((doc) => doc.isValid)

  return {
    isValid,
    decryptedAt,
    validatedAt,
    documents: documentValidations,
  }
}

async function validateDocument(document: MDocDocument, requestedDocType: string): Promise<MDocDocumentValidation> {
  invariant(document.issuerSigned, 'Document missing issuerSigned data')

  // Check for element-level errors
  if (document.errors && document.errors.length > 0) {
    const errorSummary = document.errors
      .map((err) =>
        Object.entries(err)
          .map(([namespace, elements]) =>
            Object.entries(elements)
              .map(([elementId, code]) => `${namespace}.${elementId}: error code ${code}`)
              .join(', '),
          )
          .join(', '),
      )
      .join(', ')
    throw new Error(`Document contains element errors: ${errorSummary}`)
  }

  // Step 4: Verify that the DocType matches the requested DocType
  invariant(document.docType === requestedDocType, `DocType mismatch: expected "${requestedDocType}", got "${document.docType}"`)

  const { issuerSigned } = document

  // Step 1 & 2: Validate certificate and verify COSE_Sign1 signature
  const [mso, validatedCert, certValidation] = await validateIssuerAuth(issuerSigned, requestedDocType)

  // Additional DocType check against MSO
  invariant(mso.docType === document.docType, `MSO DocType "${mso.docType}" does not match document DocType "${document.docType}"`)

  // Step 3: Validate digests for all IssuerSignedItems
  const digestValidations = await validateIssuerSignedItemDigests(issuerSigned, mso)

  // Step 5: Validate ValidityInfo timestamps
  const { isWithinValidityPeriod, msoValidityInfo } = validateValidityInfo(mso.validityInfo, validatedCert)

  return {
    isValid: true,
    docType: document.docType,
    certificate: certValidation,
    signatureVerified: true,
    digestAlgorithm: mso.digestAlgorithm,
    digestValidations,
    docTypeMatches: true,
    requestedDocType,
    receivedDocType: mso.docType,
    msoValidityInfo,
    isWithinValidityPeriod,
  }
}

/**
 * Validates the IssuerAuth COSE_Sign1 structure and returns the decoded MSO with validated certificate and validation details.
 *
 * Implements ISO18013-5 sections 9.3.1 steps 1-2:
 * 1. Validate the certificate included in the MSO header according to 9.3.3.
 * 2. Verify the digital signature of the IssuerAuth structure (see 9.1.2.4) using the
 *    working_public_key, working_public_key_parameters, and working_public_key_algorithm
 *    from the certificate validation procedure of step 1.
 */
async function validateIssuerAuth(
  issuerSigned: MDocIssuerSigned,
  requestedDocType: string,
): Promise<[MobileSecurityObject, Certificate, MDocCertificateValidation]> {
  const { issuerAuth } = issuerSigned
  invariant(issuerAuth.payload, 'IssuerAuth payload is null')

  const sign1 = new Sign1(issuerAuth.protectedHeaders, issuerAuth.unprotectedHeaders, issuerAuth.payload, issuerAuth.signature)

  // Extract X.509 certificate chain from unprotected headers
  // According to RFC 8152 and the COSE X.509 headers spec:
  // - x5chain parameter label is 33
  // - The unprotectedHeaders is a Map with numeric keys (COSE header parameter labels)
  // - The value can be a single certificate (bstr) or an array of certificates
  const x5chainRaw = issuerAuth.unprotectedHeaders.get(33)
  invariant(x5chainRaw, 'Missing x5chain (parameter 33) in issuerAuth unprotected headers')
  const x5chain = Array.isArray(x5chainRaw) ? x5chainRaw : [x5chainRaw]
  invariant(x5chain.length > 0, 'x5chain is empty')
  invariant(
    x5chain.every((cert) => cert instanceof Uint8Array || Buffer.isBuffer(cert)),
    'x5chain contains non-binary certificate data',
  )

  const x5chainBytes: Uint8Array[] = x5chain.map((cert) =>
    Buffer.isBuffer(cert) ? new Uint8Array(cert.buffer, cert.byteOffset, cert.byteLength) : (cert as Uint8Array),
  )

  // Step 1: Perform full X.509 certificate validation according to ISO 18013-5 § 9.3.3
  // This includes:
  // - RFC 5280 § 6.1 basic path validation
  // - ISO 18013-5 specific checks (country/state matching between IACA and leaf cert)
  // - Certificate validity period checking
  //
  // NOTE: ISO 18013-5 § 9.3.1 step 5 requires checking that the MSO 'signed' date
  // is within the certificate validity period. However, we have an architectural constraint:
  // we must verify the certificate chain BEFORE we can verify the COSE signature and decode
  // the MSO to access the 'signed' date. Therefore:
  // 1. We validate the certificate chain against the current time here
  // 2. We verify the COSE signature using the validated certificate
  // 3. We decode the MSO and check its 'signed' date against the certificate validity
  //
  // This approach is secure because:
  // - If the certificate was valid at the MSO 'signed' time but has since expired,
  //   the signature will still verify (signatures don't expire)
  // - We explicitly check the 'signed' date is within cert validity in step 3
  // - We check the current time is within the mDoc validity window (validFrom/validUntil)

  // Load trusted IACA root certificates
  const trustedRootCerts = await fetchIacaCertificates({ filterByDocType: [requestedDocType] })

  // Perform full X.509 validation
  // Using current time for now - the MSO 'signed' date will be validated separately
  const validationResult = await validateX509CertificateChain(x5chainBytes, trustedRootCerts, {
    validationTime: new Date(),
  })
  const validatedCert = validationResult.certificate

  // Step 2: Verify the COSE_Sign1 digital signature using the validated certificate
  // The @auth0/cose library's verifyX509() method:
  // 1. Extracts the x5chain from the COSE unprotected headers (parameter 33)
  // 2. Validates the chain against the trusted root CAs provided
  // 3. Extracts the public key from the leaf certificate
  // 4. Verifies the signature using that public key
  //
  // We pass the trusted root certificates (in PEM format) so the library can validate
  // the x5chain that's already embedded in the COSE message
  const trustedRootCertsPem = trustedRootCerts.map((cert) => derToPem(cert))
  await sign1.verifyX509(trustedRootCertsPem)

  // Decode the payload to get the MobileSecurityObject
  // The payload is MobileSecurityObjectBytes = #6.24(bstr .cbor MobileSecurityObject)
  // The payload should be CBOR tag 24 (embedded CBOR)
  const payloadDecoded = decode(issuerAuth.payload) as { tag: number; contents: Uint8Array }
  invariant(payloadDecoded.tag === 24 || payloadDecoded.tag === 0, 'IssuerAuth payload is not CBOR tag 24 or 0')
  const msoBytes = payloadDecoded.tag === 24 ? payloadDecoded.contents : issuerAuth.payload

  const mso = decode<MobileSecurityObject>(msoBytes)

  invariant(mso.version, 'MSO missing version')
  invariant(mso.digestAlgorithm, 'MSO missing digestAlgorithm')
  invariant(mso.valueDigests, 'MSO missing valueDigests')
  invariant(mso.docType, 'MSO missing docType')
  invariant(mso.validityInfo, 'MSO missing validityInfo')

  const certValidation: MDocCertificateValidation = {
    isValid: validationResult.isValid,
    subject: validationResult.details.subject,
    issuer: validationResult.details.issuer,
    validity: {
      notBefore: validationResult.details.validity.notBefore,
      notAfter: validationResult.details.validity.notAfter,
    },
    serialNumber: validationResult.details.serialNumber,
  }
  return [mso, validatedCert, certValidation]
}

/**
 * Validates the digests of all IssuerSignedItems against the MSO valueDigests and returns validation details.
 *
 * Implements ISO18013-5 section 9.3.1 step 3:
 * Calculate the digest value for every IssuerSignedItem returned and verify
 * that these calculated digests equal the corresponding digest values in the MSO.
 *
 * Digest calculation is defined in ISO18013-5 section 9.1.2.5:
 * - The digest is calculated over the IssuerSignedItemBytes (CBOR-encoded IssuerSignedItem)
 * - Each IssuerSignedItem includes: digestID, random, elementIdentifier, elementValue
 */
async function validateIssuerSignedItemDigests(issuerSigned: MDocIssuerSigned, mso: MobileSecurityObject): Promise<MDocDigestValidation[]> {
  const { nameSpaces } = issuerSigned
  const { valueDigests, digestAlgorithm } = mso
  const hashAlgorithm = getMsoDigestAlgorithm(digestAlgorithm)
  const digestValidations: MDocDigestValidation[] = []

  for (const [namespace, items] of Object.entries(nameSpaces)) {
    invariant(valueDigests[namespace], `MSO missing valueDigests for namespace "${namespace}"`)

    const namespaceDigests = valueDigests[namespace]

    for (const item of items) {
      const { issuerSignedItem, issuerSignedItemBytes } = item
      const { digestID } = issuerSignedItem

      const expectedDigest = namespaceDigests.get(digestID)
      invariant(expectedDigest, `MSO missing digest for namespace "${namespace}" digestID ${digestID}`)
      const expectedDigestBuffer = Buffer.from(expectedDigest)

      // Calculate the actual digest over the IssuerSignedItemBytes
      const actualDigest = createHash(hashAlgorithm).update(issuerSignedItemBytes).digest()

      if (!actualDigest.equals(expectedDigest)) {
        throw new Error(
          `Digest mismatch for namespace "${namespace}" element "${issuerSignedItem.elementIdentifier}" (digestID ${digestID}): ` +
            `expected ${expectedDigestBuffer.toString('hex')}, got ${actualDigest.toString('hex')}`,
        )
      }

      digestValidations.push({
        namespace,
        elementIdentifier: issuerSignedItem.elementIdentifier,
        digestID,
        isValid: true,
      })
    }
  }

  return digestValidations
}

/**
 * Validates the ValidityInfo structure from the MSO and returns validation details.
 *
 * Implements ISO18013-5 section 9.3.1 step 5:
 * - The 'signed' date is within the validity period of the certificate
 * - The current timestamp shall be equal or later than the 'validFrom' element
 * - The 'validUntil' element shall be equal or later than the current timestamp
 */
function validateValidityInfo(
  validityInfo: MobileSecurityObject['validityInfo'],
  certificate: Certificate,
): { isWithinValidityPeriod: boolean; msoValidityInfo: MDocMsoValidityInfo } {
  // Convert to Date objects if they aren't already
  const { signed, validFrom, validUntil } = validityInfo

  // Check that the MSO 'signed' date is within the certificate validity period
  // This is a critical requirement from ISO 18013-5 § 9.3.1 step 5
  validateCertificateValidityForDate(certificate, signed)

  const now = new Date()
  invariant(now >= validFrom, `mDoc not yet valid: validFrom is ${validFrom.toISOString()}, current time is ${now.toISOString()}`)
  invariant(now <= validUntil, `mDoc expired: validUntil is ${validUntil.toISOString()}, current time is ${now.toISOString()}`)

  return {
    isWithinValidityPeriod: true,
    msoValidityInfo: {
      signed,
      validFrom,
      validUntil,
      expectedUpdate: validityInfo.expectedUpdate
        ? validityInfo.expectedUpdate instanceof Date
          ? validityInfo.expectedUpdate
          : new Date(validityInfo.expectedUpdate)
        : undefined,
    },
  }
}

function getMsoDigestAlgorithm(digestAlgorithm: MobileSecurityObject['digestAlgorithm']): string {
  switch (digestAlgorithm) {
    case 'SHA-256':
      return 'sha256'
    case 'SHA-384':
      return 'sha384'
    case 'SHA-512':
      return 'sha512'
    default:
      assertExhaustive(digestAlgorithm)
  }
}
