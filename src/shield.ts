import type { ShieldSchema } from '@makerx/graphql-core'
import { isDev, isLocalDev } from '@makerx/node-common'
import { allow, and, or, shield } from 'graphql-shield'
import type { IRules } from 'graphql-shield/typings/types'
import {
  hasTokenAcquisitionRole,
  hasTokenAcquisitionRoleRequiringIdentityAccess,
  isLimitedAccessApp,
  isLimitedAnonymousPresentationApp,
  isLimitedIssuanceApp,
  isLimitedListContractsApp,
  isLimitedPresentationApp,
  isValidAcquireLimitedAccessTokenRequest,
  isValidLimitedAccessIssuanceFilter,
  isValidLimitedAccessPresentationFilter,
  isValidLimitedContractRequest,
  isValidLimitedIdentityRequest,
  isValidLimitedIssuanceRequest,
  isValidLimitedPresentationRequest,
  requestIdFilterDefined,
} from './features/limited-access-tokens'
import type { Resolvers } from './generated/graphql'
import { hasAnyRoleRuleWithName, hasRoleRule } from './util/shield-utils'

export enum UserRoles {
  reader = 'VerifiableCredential.Reader',
  issuer = 'VerifiableCredential.Issuer',
  credentialAdmin = 'VerifiableCredential.CredentialAdmin',
  partnerAdmin = 'VerifiableCredential.PartnerAdmin',
}

const isUserWithReadPermissions = hasAnyRoleRuleWithName('isUserWithReadPermissions', ...Object.values(UserRoles))

const isIssuerUser = hasRoleRule(UserRoles.issuer)
const isCredentialAdminUser = hasRoleRule(UserRoles.credentialAdmin)
const isPartnerAdminUser = hasRoleRule(UserRoles.partnerAdmin)

// general app roles for Issue & Present
const isIssuanceApp = hasRoleRule('VerifiableCredential.Issue', 'isIssuanceApp')
const isPresentationApp = hasRoleRule('VerifiableCredential.Present', 'isPresentationApp')

const isAllowedToIssue = or(isIssuerUser, isCredentialAdminUser, isIssuanceApp, isValidLimitedIssuanceRequest)

const fallbackRule = or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isLimitedAccessApp)

// issuance and presentation access rules
const isAllowedToViewIssuances = or(isUserWithReadPermissions, isIssuanceApp, isValidLimitedAccessIssuanceFilter)
const isAllowedToViewPresentations = or(isUserWithReadPermissions, isPresentationApp, isValidLimitedAccessPresentationFilter)
export const rules = {
  Query: {
    '*': isUserWithReadPermissions,
    healthcheck: allow,
    contract: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isValidLimitedContractRequest),
    findContracts: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isLimitedListContractsApp),
    identity: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isValidLimitedIdentityRequest),
    findIssuances: isAllowedToViewIssuances,
    findPresentations: isAllowedToViewPresentations,
    findNetworkIssuers: isPartnerAdminUser,
    networkContracts: isPartnerAdminUser,
  },
  Mutation: {
    '*': isCredentialAdminUser,
    acquireLimitedAccessToken: isValidAcquireLimitedAccessTokenRequest,
    createIssuanceRequest: isAllowedToIssue,
    createPresentationRequest: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedPresentationRequest),
    saveIdentity: or(isAllowedToIssue, hasTokenAcquisitionRoleRequiringIdentityAccess),
    createPartner: isPartnerAdminUser,
    updatePartner: isPartnerAdminUser,
  },
  // Subscription subscribe rules currently depend on patched graphql-middleware
  Subscription: {
    '*': isCredentialAdminUser,
    // Lock down presentations and issuance event subscriptions to the app that created the request (or admins)
    presentationEvent: or(
      isCredentialAdminUser,
      and(
        requestIdFilterDefined,
        or(isUserWithReadPermissions, isPresentationApp, isLimitedPresentationApp, isLimitedAnonymousPresentationApp),
      ),
    ),
    issuanceEvent: or(isIssuerUser, isCredentialAdminUser, and(requestIdFilterDefined, or(isIssuanceApp, isLimitedIssuanceApp))),
  },
  Contract: {
    issuances: isAllowedToViewIssuances,
    presentations: isAllowedToViewPresentations,
  },
  Identity: {
    '*': or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, hasTokenAcquisitionRoleRequiringIdentityAccess),
  },
  AccessTokenResponse: {
    '*': hasTokenAcquisitionRole,
  },
}
export const permissions = wrappedShield(rules)

function wrappedShield(x: ShieldSchema<Resolvers>) {
  return shield(x as IRules, {
    fallbackRule,
    debug: isLocalDev || isDev, // [doc](https://the-guild.dev/graphql/shield/docs/shield) says: _Toggle debug mode._ (???)
    allowExternalErrors: true, // we don't want shield to catch and convert all errors to: Not Authorised!
  })
}
