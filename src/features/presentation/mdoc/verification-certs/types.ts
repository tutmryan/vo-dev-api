/**
 * Certificate Profile types as defined in ISO 18013-5 Annex B
 */
export enum CertificateProfile {
  /** Document Signer certificate (used in IssuerAuth) */
  DS = 'DS',
  /** IACA (Issuing Authority Certificate Authority) certificate */
  IACA = 'IACA',
  /** Reader certificate (used for reader authentication) */
  READER = 'READER',
}

/**
 * Certificate information entry in VICAL
 * Based on ISO 18013-5 § C.1.7.1
 */
export type VicalCertificateInfo = {
  /** DER-encoded X.509 certificate */
  certificate: Uint8Array
  /** Serial number from the certificate (hex string format) */
  serialNumber: string
  /** Subject Key Identifier from the certificate */
  ski: Uint8Array
  /** Document types for which this certificate may be used as a trust point */
  docType: string[]
  /** Type of certificate (DS, IACA, READER) */
  certificateProfile?: CertificateProfile[]
  /** Name of the certificate issuing authority */
  issuingAuthority?: string
  /** ISO 3166-1 or ISO 3166-2 country/region code */
  issuingCountry?: string
  /** State or province name of the certificate issuing authority */
  stateOrProvinceName?: string
  /** Additional extensions */
  extensions?: Record<string, unknown>
}

/**
 * VICAL structure as defined in ISO 18013-5 § C.1.7.1
 *
 * The VICAL is encapsulated and signed by an untagged COSE_Sign1 structure (RFC 8152).
 * The payload of the COSE_Sign1 is the CBOR-encoded VICAL structure.
 */
export type Vical = {
  /** VICAL structure version, currently "1.0" */
  version: string
  /** Identifies the VICAL provider (e.g., "AAMVA", "Austroads") */
  vicalProvider: string
  /** Date-time of VICAL issuance */
  date: Date
  /** Identifies the specific issue of the VICAL, should be unique and monotonically increasing */
  vicalIssueID?: number
  /** Next VICAL is expected to be issued before this date-time */
  nextUpdate?: Date
  /** List of trusted certificate information */
  certificateInfos: VicalCertificateInfo[]
  /** Can be used for proprietary extensions */
  extensions?: Record<string, unknown>
  /** Future extensions (RFU - Reserved for Future Use) */
  [key: string]: unknown
}

/**
 * Parsed and verified VICAL with metadata
 */
export type ParsedVical = {
  /** The parsed VICAL data */
  vical: Vical
  /** When this VICAL was fetched */
  fetchedAt: Date
  /** When this VICAL should be refreshed (based on nextUpdate or default policy) */
  refreshAt: Date
  /** The raw CBOR bytes (for caching) */
  rawBytes: Uint8Array
  /** Signature verification status */
  signatureVerified: boolean
  /** Certificates used to verify the VICAL signature */
  signerCertificates?: Uint8Array[]
}

/**
 * VICAL Provider configuration
 */
export type VicalProviderConfig = {
  /** Unique identifier for this provider */
  id: string
  /** Human-readable name */
  name: string
  /** URL to fetch the VICAL from */
  vicalUrl: string
  vicalProcessResponse?: (responses: Uint8Array) => Promise<Uint8Array>
  /** URL to fetch the VICAL signer certificate from */
  signerCertUrls: string[]
  signerCertProcessResponse?: (responses: Map<string, Uint8Array>) => Promise<Uint8Array[]>
}

/**
 * VICAL fetch result
 */
export type VicalFetchResult = {
  /** The fetched VICAL data */
  vical: Vical
  /** Raw CBOR bytes */
  rawBytes: Uint8Array
  /** When it was fetched */
  fetchedAt: Date
  /** Provider that supplied this VICAL */
  provider: VicalProviderConfig
}

/**
 * Options for VICAL fetching and parsing
 */
export type VicalOptions = {
  /** Filter certificates by docType */
  filterByDocType?: string[]
}
