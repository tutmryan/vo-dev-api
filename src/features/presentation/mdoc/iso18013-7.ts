import type { MDocRequestClaimPath, MDocRequestDetails, ProcessedMDocRequestResponse } from './types'

// Disable linting for this file as ISO 18013-7 implementation is not yet complete
/* eslint-disable @typescript-eslint/no-unused-vars */

export async function buildISO18013_7DeviceRequest(
  requestId: string,
  docType: string,
  requestedClaims: MDocRequestClaimPath[],
): Promise<{ deviceRequest: string; encryptionInfo: string }> {
  throw new Error('Apple ISO18013-7 is not yet implemented.')
}

export async function decodeAndValidateISO18013_7Response(
  { requestId }: MDocRequestDetails,
  encodedResponse: string,
): Promise<ProcessedMDocRequestResponse> {
  throw new Error('Apple ISO18013-7 is not yet implemented.')
}
