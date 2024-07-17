import type { ShieldSchema } from '@makerx/graphql-core'
import { isDev, isLocalDev } from '@makerx/node-common'
import { GraphQLError } from 'graphql'
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
import {
  hasApprovalRequestPresentationAndMatchesApprovalRequestId,
  isApprovalRequestApp,
  isLimitedApprovalApp,
  isValidLimitedApprovalPresentationFilter,
  isValidLimitedPresentationRequestForApproval,
} from './features/limited-approval-tokens/shield-rules'
import type { Resolvers } from './generated/graphql'
import { AppRoles, UserRoles } from './roles'
import { hasAnyRoleRuleWithName, hasRoleRule } from './util/shield-utils'

const isUserWithReadPermissions = hasAnyRoleRuleWithName('isUserWithReadPermissions', ...Object.values(UserRoles))

const isIssuerUser = hasRoleRule(UserRoles.issuer)
const isCredentialAdminUser = hasRoleRule(UserRoles.credentialAdmin)
const isPartnerAdminUser = hasRoleRule(UserRoles.partnerAdmin)
const isApprovalRequestAdminUser = hasRoleRule(UserRoles.approvalRequestAdmin)

// general app roles for Issue & Present
const isIssuanceApp = hasRoleRule(AppRoles.issue, 'isIssuanceApp')
const isPresentationApp = hasRoleRule(AppRoles.present, 'isPresentationApp')

const isAllowedToIssue = or(isIssuerUser, isIssuanceApp, isValidLimitedIssuanceRequest)

const fallbackRule = or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isLimitedAccessApp, isLimitedApprovalApp)

// issuance and presentation access rules
const isAllowedToViewIssuances = or(isUserWithReadPermissions, isIssuanceApp, isValidLimitedAccessIssuanceFilter)
const isAllowedToViewPresentations = or(
  isUserWithReadPermissions,
  isPresentationApp,
  isValidLimitedAccessPresentationFilter,
  isValidLimitedApprovalPresentationFilter,
)
export const rules: ShieldSchema<Resolvers> = {
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
    approvalRequest: or(isApprovalRequestAdminUser, and(isLimitedApprovalApp, hasApprovalRequestPresentationAndMatchesApprovalRequestId)),
    actionedApprovalData: or(isApprovalRequestAdminUser, isApprovalRequestApp),
  },
  Mutation: {
    '*': isCredentialAdminUser,
    acquireLimitedAccessToken: and(hasTokenAcquisitionRole, isValidAcquireLimitedAccessTokenRequest),
    acquireLimitedApprovalToken: allow,
    acquireLimitedPhotoCaptureToken: allow,
    createIssuanceRequest: isAllowedToIssue,
    createPresentationRequest: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedPresentationRequest),
    saveIdentity: or(
      isIssuerUser,
      isIssuanceApp,
      isLimitedIssuanceApp,
      isCredentialAdminUser,
      hasTokenAcquisitionRoleRequiringIdentityAccess,
    ),
    createPartner: isPartnerAdminUser,
    updatePartner: isPartnerAdminUser,
    createApprovalRequest: isApprovalRequestApp,
    createPresentationRequestForApproval: isValidLimitedPresentationRequestForApproval,
    actionApprovalRequest: and(isLimitedApprovalApp, hasApprovalRequestPresentationAndMatchesApprovalRequestId),
    createPhotoCaptureRequest: isAllowedToIssue,
  },
  // Subscription subscribe rules currently depend on patched graphql-middleware
  Subscription: {
    '*': isCredentialAdminUser,
    // Lock down presentations and issuance event subscriptions to the app that created the request (or admins)
    presentationEvent: or(
      isCredentialAdminUser,
      and(
        requestIdFilterDefined,
        or(isUserWithReadPermissions, isPresentationApp, isLimitedPresentationApp, isLimitedAnonymousPresentationApp, isLimitedApprovalApp),
      ),
    ),
    issuanceEvent: or(isIssuerUser, isCredentialAdminUser, and(requestIdFilterDefined, or(isIssuanceApp, isLimitedIssuanceApp))),
  },
  Contract: {
    issuances: isAllowedToViewIssuances,
    presentations: isAllowedToViewPresentations,
  },
  Identity: {
    '*': or(
      isUserWithReadPermissions,
      isIssuanceApp,
      isPresentationApp,
      hasTokenAcquisitionRoleRequiringIdentityAccess,
      isLimitedAccessApp,
    ),
  },
  AccessTokenResponse: {
    '*': hasTokenAcquisitionRole,
  },
  ApprovalRequest: {
    '*': or(isLimitedApprovalApp, isApprovalRequestAdminUser),
  },
  ApprovalRequestResponse: {
    '*': isApprovalRequestApp,
  },
  ApprovalTokenResponse: {
    '*': allow,
  },
  PhotoCaptureTokenResponse: {
    '*': allow,
  },
  ActionedApprovalData: {
    '*': or(isApprovalRequestAdminUser, isApprovalRequestApp),
  },
  ActionedBy: {
    '*': or(isApprovalRequestAdminUser, isApprovalRequestApp),
  },
}
export const permissions = wrappedShield(rules)

function wrappedShield(x: ShieldSchema<Resolvers>) {
  return shield(x as IRules, {
    fallbackRule,
    debug: isLocalDev || isDev, // [doc](https://the-guild.dev/graphql/shield/docs/shield) says: _Toggle debug mode._ (???)
    allowExternalErrors: true, // we don't want shield to catch and convert all errors to: Not Authorised!
    fallbackError: new GraphQLError('Not Authorized!', {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } },
    }),
  })
}
