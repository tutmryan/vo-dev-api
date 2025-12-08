import { Sign1 } from '@auth0/cose'
import { decode } from 'cbor2'
import { derToPem } from '../../../../util/cryptography'
import { invariant } from '../../../../util/invariant'
import type { CertificateProfile, ParsedVical, Vical, VicalCertificateInfo } from './types'

/**
 * Converts CBOR date string (tdate) to JavaScript Date
 * ISO 18013-5 uses tdate format which is an RFC 3339 date-time string
 */
function parseTDate(value: unknown): Date {
  if (typeof value === 'string') {
    const date = new Date(value)
    invariant(!isNaN(date.getTime()), 'Invalid tdate format')
    return date
  }
  if (value instanceof Date) {
    return value
  }
  invariant(false, `Expected tdate string or Date, got ${typeof value}`)
}

function parseCertificateInfo(data: Record<string, unknown>): VicalCertificateInfo {
  // Required fields
  invariant(data.certificate instanceof Uint8Array, 'certificate must be a byte string')
  invariant(typeof data.serialNumber === 'bigint' || typeof data.serialNumber === 'number', 'serialNumber must be a biguint or number')
  invariant(data.ski instanceof Uint8Array, 'ski must be a byte string')
  invariant(Array.isArray(data.docType), 'docType must be an array')

  // Convert serialNumber to hex string format
  // CBOR encodes this as a bigint/number, but we store as hex string for JSON compatibility
  const serialNumberBigInt = typeof data.serialNumber === 'bigint' ? data.serialNumber : BigInt(data.serialNumber)
  const serialNumber = serialNumberBigInt.toString(16).toUpperCase()

  // Parse docType array
  const docType = data.docType.map((dt) => {
    invariant(typeof dt === 'string', 'docType entries must be strings')
    return dt
  })

  // Optional fields
  const certificateProfile = data.certificateProfile
    ? (data.certificateProfile as string[]).map((profile) => profile as CertificateProfile)
    : undefined

  const issuingAuthority = typeof data.issuingAuthority === 'string' ? data.issuingAuthority : undefined
  const issuingCountry = typeof data.issuingCountry === 'string' ? data.issuingCountry : undefined
  const stateOrProvinceName = typeof data.stateOrProvinceName === 'string' ? data.stateOrProvinceName : undefined
  const extensions = data.extensions && typeof data.extensions === 'object' ? (data.extensions as Record<string, unknown>) : undefined

  return {
    certificate: data.certificate,
    serialNumber,
    ski: data.ski,
    docType,
    certificateProfile,
    issuingAuthority,
    issuingCountry,
    stateOrProvinceName,
    extensions,
  }
}

export function parseVicalPayload(payload: Uint8Array): Vical {
  const decoded = decode<Record<string, unknown>>(payload)

  // Required fields
  invariant(typeof decoded.version === 'string', 'version must be a string')
  invariant(typeof decoded.vicalProvider === 'string', 'vicalProvider must be a string')
  invariant(decoded.date !== undefined, 'date is required')
  invariant(Array.isArray(decoded.certificateInfos), 'certificateInfos must be an array')

  const date = parseTDate(decoded.date)
  const vicalIssueID = typeof decoded.vicalIssueID === 'number' ? decoded.vicalIssueID : undefined
  const nextUpdate = decoded.nextUpdate ? parseTDate(decoded.nextUpdate) : undefined
  const extensions =
    decoded.extensions && typeof decoded.extensions === 'object' ? (decoded.extensions as Record<string, unknown>) : undefined

  // Parse certificate infos
  const certificateInfos: VicalCertificateInfo[] = decoded.certificateInfos.map((info) => {
    invariant(typeof info === 'object' && info !== null, 'certificateInfo must be an object')
    return parseCertificateInfo(info as Record<string, unknown>)
  })

  // Extract any future extensions (keys that are not standard)
  const standardKeys = new Set(['version', 'vicalProvider', 'date', 'vicalIssueID', 'nextUpdate', 'certificateInfos', 'extensions'])
  const futureExtensions: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(decoded)) {
    if (!standardKeys.has(key)) {
      futureExtensions[key] = value
    }
  }

  return {
    version: decoded.version,
    vicalProvider: decoded.vicalProvider,
    date,
    vicalIssueID,
    nextUpdate,
    certificateInfos,
    extensions,
    ...futureExtensions,
  }
}

async function verifyVicalSignature(coseSign1Bytes: Uint8Array, signerCerts: Uint8Array[]): Promise<Uint8Array> {
  const sign1 = Sign1.decode(coseSign1Bytes)
  const signerCertsPem = signerCerts.map((c) => derToPem(c))
  await sign1.verifyX509(signerCertsPem)
  invariant(sign1.payload, 'COSE_Sign1 payload is null')
  return sign1.payload
}

export async function parseVical(vicalBytes: Uint8Array, signerCerts: Uint8Array[]): Promise<ParsedVical> {
  const payload = await verifyVicalSignature(vicalBytes, signerCerts)
  const vical = parseVicalPayload(payload)

  // Calculate refresh time
  const fetchedAt = new Date()
  const refreshAt = vical.nextUpdate || new Date(fetchedAt.getTime() + 7 * 24 * 60 * 60 * 1000) // Default: 7 days

  return {
    vical,
    fetchedAt,
    refreshAt,
    rawBytes: vicalBytes,
    signatureVerified: true,
    signerCertificates: signerCerts,
  }
}

function filterVicalByDocType(vical: Vical, docTypes: string[]): VicalCertificateInfo[] {
  return vical.certificateInfos.filter((certInfo) => {
    return certInfo.docType.some((dt) => docTypes.includes(dt))
  })
}

export function extractIacaCertificates(vical: Vical, docTypes?: string[]): Uint8Array[] {
  let certificateInfos = vical.certificateInfos

  if (docTypes && docTypes.length > 0) {
    certificateInfos = filterVicalByDocType(vical, docTypes)
  }

  // Filter for IACA certificates only (if certificateProfile is specified)
  certificateInfos = certificateInfos.filter((certInfo) => {
    if (!certInfo.certificateProfile) {
      // If no profile specified, assume it's an IACA cert
      return true
    }
    return certInfo.certificateProfile.includes('IACA' as CertificateProfile)
  })

  return certificateInfos.map((certInfo) => certInfo.certificate)
}
