import { omit } from 'lodash'
import type { Account, FindAccount } from 'oidc-provider'
import { oidcStorageService } from '.'
import { logger } from '../../logger'
import { OpenIdProfileClaim, VcInfoClaim, VcPresentedAttributesClaim, VoIdentityClaim, VoPresentationClaim } from './claims'
import { checkIssuanceIsNotRevoked } from './data'
import type { PresentationLoginAccount } from './session'

export const findAccount: FindAccount = async (_ctx, id) => {
  try {
    const account = await oidcStorageService().downloadAccount(id)
    if (account && account.issuanceId) await checkIssuanceIsNotRevoked(account.issuanceId)
    return {
      accountId: id,
      async claims(_use, _scope) {
        if (!account) return { sub: id }
        return accountToClaims(account)
      },
    } satisfies Account
  } catch (error) {
    logger.error(`Failed to find OIDC account ${id}`, { error })
    throw new Error(`Failed to find account ${id}`)
  }
}

export function accountToClaims(account: PresentationLoginAccount) {
  const { accountId: sub, presentationId, issuanceId, identity, did, credentialType, credentialClaims } = account
  const hasIdentity = !!identity
  const presentationClaimData = hasIdentity ? omit(credentialClaims, 'name') : credentialClaims
  return {
    sub,
    [OpenIdProfileClaim.Name]: identity?.name ?? credentialClaims?.name,
    [VcInfoClaim.Issuer]: did,
    [VcInfoClaim.Type]: credentialType,
    [VcInfoClaim.RevocationStatus]: account.revocationStatus,
    [VcPresentedAttributesClaim.PresentedAttributes]: presentationClaimData,
    [VoPresentationClaim.PresentationId]: presentationId,
    [VoPresentationClaim.IssuanceId]: issuanceId,
    [VoPresentationClaim.FaceCheckMatchConfidenceScore]: account.faceCheckMatchConfidenceScore,
    [VoIdentityClaim.IdentityId]: identity?.id,
    [VoIdentityClaim.IdentityIssuer]: identity?.issuer,
    [VoIdentityClaim.IdentityIdentifier]: identity?.identifier,
  }
}

export const deleteAccount = async (accountId: string) => {
  await oidcStorageService().deleteAccountIfExists(accountId)
}
