import type { Callback, MDocValidationResults } from '../../../generated/graphql'

export const mDocResponseStatus = {
  SUCCESS: 0,
  GENERAL_ERROR: 10,
  CBOR_DECODING_ERROR: 11,
  CBOR_VALIDATION_ERROR: 12,
} as const

export type MDocResponseStatus = (typeof mDocResponseStatus)[keyof typeof mDocResponseStatus]

type MDocDocumentError = {
  [docType: string]: number
}

type MDocError = {
  [namespace: string]: {
    [dataElementId: string]: number
  }
}

export type MDocNamespaceItem = {
  issuerSignedItem: {
    digestID: number
    random: Uint8Array
    elementIdentifier: string
    elementValue: unknown
  }
  issuerSignedItemBytes: Uint8Array // Exact bytes needed for signature verification
}

export type MDocIssuerSigned = {
  nameSpaces: {
    [namespace: string]: MDocNamespaceItem[]
  }
  // COSE_Sign1 structure (RFC 8152)
  issuerAuth: {
    // Protected headers as a byte string (CBOR-encoded map)
    protectedHeaders: Uint8Array
    // Decoded protected headers
    protectedHeadersDecoded: Map<number, unknown>
    // Unprotected headers as a map with numeric COSE header parameter labels
    // Common parameters:
    // - 33: x5chain (X.509 certificate chain, can be single cert or array)
    unprotectedHeaders: Map<number, Uint8Array | Uint8Array[]>
    // Payload as a byte string (contains the MobileSecurityObject)
    payload: Uint8Array | null
    signature: Uint8Array
  }
}

export type MDocDocument = {
  docType: string
  issuerSigned?: MDocIssuerSigned
  deviceSigned?: {
    [namespace: string]: {
      DeviceNameSpaces: {
        [dataElementId: string]: unknown
      }
    }
  }
  errors?: MDocError[]
}

export type MDocDeviceResponse = {
  version: string
  status: MDocResponseStatus
  documents: MDocDocument[]
  documentErrors?: MDocDocumentError[] // For unreturned documents (completely unreturned), optional error codes
}

export type MDocRequestClaimPath = {
  path: string[]
  intentToRetain?: boolean
  useForIdentity?: boolean
}

export type MDocRequestDetails = {
  requestId: string
  requestedById: string
  identityId?: string
  clientName: string
  docType: string
  requestedClaims: MDocRequestClaimPath[]
  platform?: 'android' | 'apple'
  createdAt: number
  callback?: Callback
}

/**
 * Apple ISO18013-7 device request structure
 */
export type AppleDeviceRequest = {
  version: string
  docRequests: unknown[]
}

/**
 * Apple encryption info structure
 */
export type AppleEncryptionInfo = {
  publicKey: unknown
}

export type ProcessedMDocRequestResponse = {
  mDocDeviceResponse: MDocDeviceResponse
  diagnostics?: {
    validation: MDocValidationResults
    response: string
    deviceResponse: string
  }
}

export type EphemeralKeyData = {
  encryptionPrivateKey: string // base64-encoded PKCS8 encryption private key
  signingPrivateKey?: string // base64-encoded PKCS8 signing private key (for signed requests)
  created: number
  requestId: string
}
