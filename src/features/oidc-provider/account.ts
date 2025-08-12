import { omit } from 'lodash'
import type { Account, AccountClaims, FindAccount } from 'oidc-provider'
import { oidcStorageService } from '.'
import { logger } from '../../logger'
import { mergeWithArrays } from '../../util/merge'
import {
  faceCheckAmr,
  OpenIdProfileClaim,
  presentationLoginStandardClaims,
  VcInfoClaim,
  VcPresentedAttributesClaim,
  VoIdentityClaim,
  VoPresentationClaim,
} from './claims'
import { filterToRequestedClaimsAcr, filterToRequestedClaimsAmr } from './claims-parameter'
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

export function accountToClaims(account: PresentationLoginAccount): AccountClaims {
  const { accountId: sub, presentationId, issuanceId, identity, did, credentialType, credentialClaims, mappedCredentialClaims } = account
  const hasIdentity = !!identity
  const presentationClaimData = hasIdentity ? omit(credentialClaims, 'name') : credentialClaims

  let acr: string = presentationLoginStandardClaims.acr
  acr = filterToRequestedClaimsAcr(acr, account.requestedClaims || {})

  let amr: string[] = [...presentationLoginStandardClaims.amr]
  if (account.faceCheckMatchConfidenceScore) amr.push(faceCheckAmr)
  amr = filterToRequestedClaimsAmr(amr, account.requestedClaims || {})

  const claims: AccountClaims = {
    sub,
    acr,
    amr,
    [OpenIdProfileClaim.Name]: identity?.name ?? credentialClaims?.name,
    [VcInfoClaim.Issuer]: did,
    [VcInfoClaim.Type]: credentialType,
    [VcInfoClaim.RevocationStatus]: account.revocationStatus,
    [VcPresentedAttributesClaim.PresentedAttributes]: presentationClaimData,
    [VoPresentationClaim.PresentationId]: presentationId,
    [VoPresentationClaim.IssuanceId]: issuanceId,
    [VoPresentationClaim.SupportsFaceCheck]: account.credentialSupportsFaceCheck,
    [VoPresentationClaim.FaceCheckMatchConfidenceScore]: account.faceCheckMatchConfidenceScore,
    [VoIdentityClaim.IdentityId]: identity?.id,
    [VoIdentityClaim.IdentityIssuer]: identity?.issuer,
    [VoIdentityClaim.IdentityIdentifier]: identity?.identifier,
  }

  // merge mapped claims into the standard claims
  return mergeWithArrays(mappedCredentialClaims, claims)
}

export const deleteAccount = async (accountId: string) => {
  await oidcStorageService().deleteAccountIfExists(accountId)
}
