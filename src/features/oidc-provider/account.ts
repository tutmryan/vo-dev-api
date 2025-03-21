import { omit } from 'lodash'
import type { Account, AccountClaims, FindAccount } from 'oidc-provider'
import { oidcStorageService } from '.'
import { logger } from '../../logger'
import {
  faceCheckAmr,
  OpenIdEmailClaim,
  OpenIdProfileClaim,
  presentationLoginStandardClaims,
  VcInfoClaim,
  VcPresentedAttributesClaim,
  VoIdentityClaim,
  VoPresentationClaim,
} from './claims'
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
  const { accountId: sub, presentationId, issuanceId, identity, did, credentialType, credentialClaims } = account
  const hasIdentity = !!identity
  const presentationClaimData = hasIdentity ? omit(credentialClaims, 'name') : credentialClaims
  const claims: AccountClaims = {
    sub,
    ...presentationLoginStandardClaims,
    [OpenIdProfileClaim.Name]: identity?.name ?? credentialClaims?.name,
    [OpenIdEmailClaim.Email]: credentialClaims?.email,
    [OpenIdEmailClaim.EmailVerified]: normalizeBoolean(credentialClaims?.email_verified),
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
  if (account.faceCheckMatchConfidenceScore) claims.amr = [...presentationLoginStandardClaims['amr'], faceCheckAmr]
  return claims
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', 'yes', '1', 'on'].includes(normalized)) return true
    if (['false', 'no', '0', 'off'].includes(normalized)) return false
    return Boolean(value)
  }
  return Boolean(value)
}

export const deleteAccount = async (accountId: string) => {
  await oidcStorageService().deleteAccountIfExists(accountId)
}
