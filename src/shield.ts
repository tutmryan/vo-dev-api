import type { ShieldSchema } from '@makerx/graphql-core'
import { isDev, isLocalDev } from '@makerx/node-common'
import { allow, and, or, shield } from 'graphql-shield'
import type { IRules } from 'graphql-shield/typings/types'
import {
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
const isAdmin = hasScopeRule('Admin')

// general app roles for Issue & Present
const isIssuanceApp = hasRoleRule('VerifiableCredential.Issue')
const isPresentationApp = hasRoleRule('VerifiableCredential.Present')

const isAuthorisedUnlimited = or(isAdmin, isIssuanceApp, isPresentationApp)

// issuance and presentation access rules
const isValidIssuanceFilter = or(isAdmin, isIssuanceApp, isValidLimitedAccessIssuanceFilter)
const isValidPresentationFilter = or(isAdmin, isPresentationApp, isValidLimitedAccessPresentationFilter)

export const permissions = wrappedShield({
  Query: {
    '*': isAdmin,
    healthcheck: allow,
    contract: or(isAuthorisedUnlimited, isValidLimitedContractRequest),
    findContracts: or(isAuthorisedUnlimited, isLimitedListContractsApp),
    identity: or(isAuthorisedUnlimited, isValidLimitedIdentityRequest),
    findIssuances: isValidIssuanceFilter,
    findPresentations: isValidPresentationFilter,
  },
  Mutation: {
    '*': isAdmin,
    createIssuanceRequest: or(isAdmin, isIssuanceApp, isValidLimitedIssuanceRequest),
    createPresentationRequest: or(isAdmin, isPresentationApp, isValidLimitedPresentationRequest),
    saveIdentity: isAuthorisedUnlimited,
    acquireLimitedAccessToken: isValidAcquireLimitedAccessTokenRequest,
  },
  // Subscription subscribe rules currently depend on patched graphql-middleware
  Subscription: {
    '*': isAdmin,
    // Lock down presentations and issuance event subscriptions to the app that created the request (or admins)
    presentationEvent: or(
      isAdmin,
      and(requestIdFilterDefined, or(isPresentationApp, isLimitedPresentationApp, isLimitedAnonymousPresentationApp)),
    ),
    issuanceEvent: or(isAdmin, and(requestIdFilterDefined, or(isIssuanceApp, isLimitedIssuanceApp))),
  },
  Contract: {
    issuances: isValidIssuanceFilter,
    presentations: isValidPresentationFilter,
  },
})

function wrappedShield(x: ShieldSchema<Resolvers>) {
  return shield(x as IRules, {
    fallbackRule: or(isAuthorisedUnlimited, isLimitedAccessApp),
    debug: isLocalDev || isDev, // [doc](https://the-guild.dev/graphql/shield/docs/shield) says: _Toggle debug mode._ (???)
    allowExternalErrors: true, // we don't want shield to catch and convert all errors to: Not Authorised!
  })
}
