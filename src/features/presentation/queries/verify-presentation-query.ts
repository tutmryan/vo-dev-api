import type { QueryContext } from '../../../cqs'
import type { PresentationReceiptInput, VerifyPresentationResult } from '../../../generated/graphql'
import { SIOP_V2_ISSUER, verifyDidJwt } from '../../../util/did-jwt-verifier'

export async function VerifyPresentationQuery(
  this: QueryContext,
  { id_token: idToken, faceCheck }: PresentationReceiptInput,
  presentedAt: string,
): Promise<VerifyPresentationResult> {
  if (!idToken) {
    throw new Error('Receipt does not contain an id_token')
  }

  const presentedDate = new Date(presentedAt)
  if (isNaN(presentedDate.getTime())) {
    throw new Error(`Invalid presentedAt date: ${presentedAt}`)
  }

  // Audience: authority DID (for id_token)
  const audDid = (await this.services.verifiedIdAdmin.authority()).didModel.did

  await verifyDidJwt(idToken, {
    presentedAt: presentedDate,
    issuer: SIOP_V2_ISSUER,
    audience: audDid,
  })

  // faceCheck: does NOT have an 'aud' claim, but expects the same value in 'iss'
  if (faceCheck) {
    await verifyDidJwt(faceCheck, {
      presentedAt: presentedDate,
      issuer: audDid,
    })
  }

  return {
    idTokenValid: true,
    faceCheckValid: faceCheck ? true : null,
  }
}
