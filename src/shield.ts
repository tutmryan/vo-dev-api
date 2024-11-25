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
import {
  isLimitedAsyncIssuanceApp,
  isLimitedAsyncIssuancePhotoCaptureUser,
  isValidCreateIssuanceRequestForAsyncIssuanceRequest,
  isValidLimitedAsyncIssuanceIssuanceFilter,
} from './features/limited-async-issuance-tokens/shield-rules'
import {
  isOidcAuthnClient,
  isValidOidcAuthnPresentationFilter,
  isValidOidcAuthnPresentationRequest,
} from './features/oidc-provider/shield-rules'
import { isValidCapturePhoto, isValidLimitedIssuancePhotoCaptureRequest } from './features/photo-capture/shield-rules'
import type { Resolvers } from './generated/graphql'
import { AppRoles, UserRoles } from './roles'
import { hasAnyRoleRuleWithName, hasRoleRule } from './util/shield-utils'

const isUserWithReadPermissions = hasAnyRoleRuleWithName('isUserWithReadPermissions', ...Object.values(UserRoles))

const isIssuerUser = hasRoleRule(UserRoles.issuer)
const isCredentialAdminUser = hasRoleRule(UserRoles.credentialAdmin)
const isPartnerAdminUser = hasRoleRule(UserRoles.partnerAdmin)
const isApprovalRequestAdminUser = hasRoleRule(UserRoles.approvalRequestAdmin)
const isOidcAdminUser = hasRoleRule(UserRoles.oidcAdmin)

// general app roles for Issue & Present
const isIssuanceApp = hasRoleRule(AppRoles.issue, 'isIssuanceApp')
const isPresentationApp = hasRoleRule(AppRoles.present, 'isPresentationApp')

const isIssuer = or(isIssuerUser, isIssuanceApp, isLimitedIssuanceApp)
const isAsyncIssuer = or(isIssuerUser, isIssuanceApp)

const fallbackRule = or(
  isUserWithReadPermissions,
  isIssuanceApp,
  isPresentationApp,
  isLimitedAccessApp,
  isLimitedApprovalApp,
  isLimitedAsyncIssuanceApp,
  isOidcAuthnClient,
)

// issuance and presentation access rules
const isAllowedToViewIssuances = or(
  isUserWithReadPermissions,
  isIssuanceApp,
  isValidLimitedAccessIssuanceFilter,
  isValidLimitedAsyncIssuanceIssuanceFilter,
)
const isAllowedToViewPresentations = or(
  isUserWithReadPermissions,
  isPresentationApp,
  isValidLimitedAccessPresentationFilter,
  isValidLimitedApprovalPresentationFilter,
  isValidOidcAuthnPresentationFilter,
)
export const rules: ShieldSchema<Resolvers> = {
  Query: {
    '*': isUserWithReadPermissions,
    healthcheck: allow,
    contract: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isValidLimitedContractRequest),
    findContracts: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isLimitedListContractsApp),
    findApprovalRequests: isApprovalRequestAdminUser,
    identity: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isValidLimitedIdentityRequest),
    findIssuances: isAllowedToViewIssuances,
    findPresentations: isAllowedToViewPresentations,
    findNetworkIssuers: isPartnerAdminUser,
    networkContracts: isPartnerAdminUser,
    approvalRequest: or(isApprovalRequestAdminUser, and(isLimitedApprovalApp, hasApprovalRequestPresentationAndMatchesApprovalRequestId)),
    actionedApprovalData: or(isApprovalRequestAdminUser, isApprovalRequestApp),
    photoCaptureStatus: or(isIssuer, isLimitedAsyncIssuancePhotoCaptureUser),
    asyncIssuanceRequest: isIssuer,
    asyncIssuanceContact: isIssuerUser,
    approvalRequestTypes: isApprovalRequestAdminUser,
    identityByIdentifier: or(
      isUserWithReadPermissions,
      isIssuanceApp,
      isLimitedIssuanceApp,
      hasTokenAcquisitionRoleRequiringIdentityAccess,
    ),
    identitiesByIdentifiers: or(
      isUserWithReadPermissions,
      isIssuanceApp,
      isLimitedIssuanceApp,
      hasTokenAcquisitionRoleRequiringIdentityAccess,
    ),
  },
  Mutation: {
    '*': isCredentialAdminUser,
    acquireLimitedAccessToken: and(hasTokenAcquisitionRole, isValidAcquireLimitedAccessTokenRequest),
    acquireLimitedApprovalToken: allow,
    acquireLimitedPhotoCaptureToken: allow,
    createIssuanceRequest: or(isIssuerUser, isIssuanceApp, isValidLimitedIssuanceRequest),
    createIssuanceRequestForAsyncIssuance: isValidCreateIssuanceRequestForAsyncIssuanceRequest,
    createPresentationRequest: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedPresentationRequest),
    createPresentationRequestForAuthn: isValidOidcAuthnPresentationRequest,
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
    updateApprovalRequest: isApprovalRequestApp,
    cancelApprovalRequest: or(isApprovalRequestAdminUser, isApprovalRequestApp),
    createPresentationRequestForApproval: isValidLimitedPresentationRequestForApproval,
    actionApprovalRequest: and(isLimitedApprovalApp, hasApprovalRequestPresentationAndMatchesApprovalRequestId),
    createPhotoCaptureRequest: or(isIssuerUser, isIssuanceApp, isValidLimitedIssuancePhotoCaptureRequest),
    capturePhoto: isValidCapturePhoto,
    createAsyncIssuanceRequest: isAsyncIssuer,
    updateAsyncIssuanceContact: isAsyncIssuer,
    sendAsyncIssuanceVerification: allow,
    acquireAsyncIssuanceToken: allow,
    resendAsyncIssuanceNotifications: isAsyncIssuer,
    resendAsyncIssuanceNotification: isAsyncIssuer,
    cancelAsyncIssuanceRequest: isAsyncIssuer,
    createOidcClient: isOidcAdminUser,
    updateOidcClient: isOidcAdminUser,
    deleteOidcClient: isOidcAdminUser,
    createOidcResource: isOidcAdminUser,
    updateOidcResource: isOidcAdminUser,
    deleteOidcResource: isOidcAdminUser,
    createOidcClientResource: isOidcAdminUser,
    updateOidcClientResource: isOidcAdminUser,
    deleteOidcClientResource: isOidcAdminUser,
  },
  // Subscription subscribe rules currently depend on patched graphql-middleware
  Subscription: {
    '*': isCredentialAdminUser,
    // Lock down presentations and issuance event subscriptions to the app that created the request (or admins)
    presentationEvent: or(
      isCredentialAdminUser,
      and(
        requestIdFilterDefined,
        or(
          isUserWithReadPermissions,
          isPresentationApp,
          isLimitedPresentationApp,
          isLimitedAnonymousPresentationApp,
          isLimitedApprovalApp,
          isOidcAuthnClient,
        ),
      ),
    ),
    issuanceEvent: or(
      isIssuerUser,
      isCredentialAdminUser,
      and(requestIdFilterDefined, or(isIssuanceApp, isLimitedIssuanceApp, isLimitedAsyncIssuanceApp)),
    ),
    photoCaptureEvent: or(isIssuer, isLimitedAsyncIssuancePhotoCaptureUser),
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
      isOidcAuthnClient,
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
  ActionedApprovalData: {
    '*': or(isApprovalRequestAdminUser, isApprovalRequestApp),
  },
  ActionedBy: {
    '*': or(isApprovalRequestAdminUser, isApprovalRequestApp),
  },
  PhotoCaptureTokenResponse: {
    '*': allow,
  },
  PhotoCaptureEventData: {
    '*': or(isIssuer, isLimitedAsyncIssuancePhotoCaptureUser),
  },
  AsyncIssuanceRequest: {
    '*': isAsyncIssuer,
  },
  AsyncIssuanceContact: {
    '*': isIssuerUser,
  },
  AsyncIssuanceTokenResponse: {
    '*': allow,
  },
  SendAsyncIssuanceVerificationResponse: {
    '*': allow,
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
