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
import { hasRoleRule, hasScopeRule } from './util/shield-utils'

// delegated auth permission: 'Admin'
const isAdminApp = hasScopeRule('Admin')

// admin app roles
const isPartnerAdminUser = hasRoleRule('VerifiableCredential.PartnerAdmin')

// general app roles for Issue & Present
const isIssuanceApp = hasRoleRule('VerifiableCredential.Issue')
const isPresentationApp = hasRoleRule('VerifiableCredential.Present')

const isAuthorisedUnlimited = or(isAdminApp, isIssuanceApp, isPresentationApp)
const fallbackRule = or(isAuthorisedUnlimited, isLimitedAccessApp)

// issuance and presentation access rules
const isValidIssuanceFilter = or(isAdminApp, isIssuanceApp, isValidLimitedAccessIssuanceFilter)
const isValidPresentationFilter = or(isAdminApp, isPresentationApp, isValidLimitedAccessPresentationFilter)
export const rules = {
  Query: {
    '*': isAdminApp,
    healthcheck: allow,
    contract: or(isAuthorisedUnlimited, isValidLimitedContractRequest),
    findContracts: or(isAuthorisedUnlimited, isLimitedListContractsApp),
    identity: or(isAuthorisedUnlimited, isValidLimitedIdentityRequest),
    findIssuances: isValidIssuanceFilter,
    findPresentations: isValidPresentationFilter,
    findNetworkIssuers: isPartnerAdminUser,
    networkContracts: isPartnerAdminUser,
  },
  Mutation: {
    '*': isAdminApp,
    createIssuanceRequest: or(isAdminApp, isIssuanceApp, isValidLimitedIssuanceRequest),
    createPresentationRequest: or(isAdminApp, isPresentationApp, isValidLimitedPresentationRequest),
    saveIdentity: or(isAuthorisedUnlimited, hasTokenAcquisitionRoleRequiringIdentityAccess),
    acquireLimitedAccessToken: isValidAcquireLimitedAccessTokenRequest,
    createPartner: isPartnerAdminUser,
    updatePartner: isPartnerAdminUser,
  },
  // Subscription subscribe rules currently depend on patched graphql-middleware
  Subscription: {
    '*': isAdminApp,
    // Lock down presentations and issuance event subscriptions to the app that created the request (or admins)
    presentationEvent: or(
      isAdminApp,
      and(requestIdFilterDefined, or(isPresentationApp, isLimitedPresentationApp, isLimitedAnonymousPresentationApp)),
    ),
    issuanceEvent: or(isAdminApp, and(requestIdFilterDefined, or(isIssuanceApp, isLimitedIssuanceApp))),
  },
  Contract: {
    issuances: isValidIssuanceFilter,
    presentations: isValidPresentationFilter,
  },
  Identity: {
    '*': or(fallbackRule, hasTokenAcquisitionRoleRequiringIdentityAccess),
  },
  AccessTokenResponse: {
    '*': or(fallbackRule, hasTokenAcquisitionRole),
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
