import type { ShieldSchema } from '@makerx/graphql-core'
import { isDev, isLocalDev } from '@makerx/node-common'
import { GraphQLError } from 'graphql'
import { allow, and, not, or, rule, shield } from 'graphql-shield'
import type { IRules } from 'graphql-shield/typings/types'
import { apiUrl } from './config'
import type { GraphQLContext } from './context'
import {
  asyncIssuanceIsToAuthenticatedUser,
  identityIsAuthenticatedUser,
  issuanceIsToAuthenticatedUser,
  presentationIsByAuthenticatedUser,
} from './features/identity/shield-rules'
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
import { AppRoles, OidcScopes, UserRoles } from './roles'
import { hasAnyRoleRuleWithName, hasRoleRule } from './util/shield-utils'

function hasApiResourceScopeRule(scope: OidcScopes) {
  return rule(`hasApiResourceScope-${scope}`, { cache: 'contextual' })((_, __, { user }: GraphQLContext) => {
    if (!user) return false
    if (user.claims.aud !== apiUrl) return false
    return user.scopes.includes(scope)
  })
}

const isUserWithReadPermissions = hasAnyRoleRuleWithName('isUserWithReadPermissions', ...Object.values(UserRoles))

// user roles
const isIssuerUser = hasRoleRule(UserRoles.issuer)
const isCredentialAdminUser = hasRoleRule(UserRoles.credentialAdmin)
const isPartnerAdminUser = hasRoleRule(UserRoles.partnerAdmin)
const isApprovalRequestAdminUser = hasRoleRule(UserRoles.approvalRequestAdmin)
const isOidcAdminUser = hasRoleRule(UserRoles.oidcAdmin)
const isInstanceAdminUser = hasRoleRule(UserRoles.instanceAdmin)

// app roles
const isIssuanceApp = hasRoleRule(AppRoles.issue, 'isIssuanceApp')
const isPresentationApp = hasRoleRule(AppRoles.present, 'isPresentationApp')
const isContractAdminApp = hasRoleRule(AppRoles.contractAdmin, 'isContractAdminApp')

// api resource scope rules
const isIssuee = hasApiResourceScopeRule(OidcScopes.issuee)

const isIssuer = or(isIssuerUser, isIssuanceApp, isLimitedIssuanceApp)
const isAsyncIssuer = or(isIssuerUser, isIssuanceApp)

const fallbackRule = or(
  isUserWithReadPermissions,
  isIssuanceApp,
  isPresentationApp,
  isContractAdminApp,
  isLimitedAccessApp,
  isLimitedApprovalApp,
  isLimitedAsyncIssuanceApp,
  isOidcAuthnClient,
  isIssuee,
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

const isAllowedToCreateAndDeleteIdentities = or(
  isIssuerUser,
  isIssuanceApp,
  isLimitedIssuanceApp,
  isCredentialAdminUser,
  hasTokenAcquisitionRoleRequiringIdentityAccess,
)

const isAllowedToViewAsyncIssuanceRequests = or(isUserWithReadPermissions, isIssuanceApp)
export const rules: ShieldSchema<Resolvers> = {
  Query: {
    '*': isUserWithReadPermissions,
    discovery: or(isUserWithReadPermissions, isIssuee),
    healthcheck: allow,
    conciergeBranding: allow,
    template: or(isUserWithReadPermissions, isContractAdminApp),
    findTemplates: or(isUserWithReadPermissions, isContractAdminApp),
    templateCombinedData: or(isUserWithReadPermissions, isContractAdminApp),
    contract: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isContractAdminApp, isValidLimitedContractRequest),
    findContracts: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isContractAdminApp, isLimitedListContractsApp),
    findApprovalRequests: isApprovalRequestAdminUser,
    identity: or(isUserWithReadPermissions, isIssuanceApp, isPresentationApp, isValidLimitedIdentityRequest),
    issuance: or(isAllowedToViewIssuances, isIssuee),
    findIssuances: isAllowedToViewIssuances,
    findAsyncIssuanceRequests: isAllowedToViewAsyncIssuanceRequests,
    findPresentations: isAllowedToViewPresentations,
    findNetworkIssuers: isPartnerAdminUser,
    networkContracts: isPartnerAdminUser,
    approvalRequest: or(isApprovalRequestAdminUser, and(isLimitedApprovalApp, hasApprovalRequestPresentationAndMatchesApprovalRequestId)),
    actionedApprovalData: or(isApprovalRequestAdminUser, isApprovalRequestApp),
    photoCaptureStatus: or(isIssuer, isLimitedAsyncIssuancePhotoCaptureUser),
    asyncIssuanceRequest: or(isAllowedToViewAsyncIssuanceRequests, isIssuee),
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
    me: allow,
    authority: or(isUserWithReadPermissions, isIssuee),
  },
  Mutation: {
    '*': isCredentialAdminUser,
    createTemplate: or(isCredentialAdminUser, isContractAdminApp),
    updateTemplate: or(isCredentialAdminUser, isContractAdminApp),
    deleteTemplate: or(isCredentialAdminUser, isContractAdminApp),
    createContract: or(isCredentialAdminUser, isContractAdminApp),
    updateContract: or(isCredentialAdminUser, isContractAdminApp),
    deleteContract: or(isCredentialAdminUser, isContractAdminApp),
    provisionContract: or(isCredentialAdminUser, isContractAdminApp),
    deprecateContract: or(isCredentialAdminUser, isContractAdminApp),
    import: or(isCredentialAdminUser, isContractAdminApp),
    acquireLimitedAccessToken: and(hasTokenAcquisitionRole, isValidAcquireLimitedAccessTokenRequest),
    acquireLimitedApprovalToken: allow,
    acquireLimitedPhotoCaptureToken: allow,
    createIssuanceRequest: or(isIssuerUser, isIssuanceApp, isValidLimitedIssuanceRequest),
    createIssuanceRequestForAsyncIssuance: or(isIssuee, isValidCreateIssuanceRequestForAsyncIssuanceRequest),
    createPresentationRequest: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedPresentationRequest),
    createPresentationRequestForAuthn: isValidOidcAuthnPresentationRequest,
    saveConciergeBranding: isInstanceAdminUser,
    deleteConciergeBranding: isInstanceAdminUser,
    saveIdentity: isAllowedToCreateAndDeleteIdentities,
    deleteIdentities: isAllowedToCreateAndDeleteIdentities,
    createPartner: isPartnerAdminUser,
    updatePartner: isPartnerAdminUser,
    suspendPartner: isPartnerAdminUser,
    resumePartner: isPartnerAdminUser,
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
    createOidcClaimMapping: isOidcAdminUser,
    updateOidcClaimMapping: isOidcAdminUser,
    deleteOidcClaimMapping: isOidcAdminUser,
    updateOidcClientClaimMappings: isOidcAdminUser,
    revokeIssuance: or(isCredentialAdminUser, isContractAdminApp),
    revokeIssuances: or(isCredentialAdminUser, isContractAdminApp),
    revokeContractIssuances: or(isCredentialAdminUser, isContractAdminApp),
    revokeIdentityIssuances: or(isCredentialAdminUser, isContractAdminApp),
    revokeUserIssuances: or(isCredentialAdminUser, isContractAdminApp),
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
      and(requestIdFilterDefined, or(isIssuanceApp, isLimitedIssuanceApp, isLimitedAsyncIssuanceApp, isIssuee)),
    ),
    photoCaptureEvent: or(isIssuer, isLimitedAsyncIssuancePhotoCaptureUser),
  },
  Contract: {
    issuances: isAllowedToViewIssuances,
    asyncIssuanceRequests: isAllowedToViewAsyncIssuanceRequests,
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
      isIssuee,
    ),
    issuances: or(isAllowedToViewIssuances, and(isIssuee, identityIsAuthenticatedUser)),
    asyncIssuanceRequests: or(isAllowedToViewAsyncIssuanceRequests, and(isIssuee, identityIsAuthenticatedUser)),
    presentations: or(isAllowedToViewPresentations, and(isIssuee, identityIsAuthenticatedUser)),
  },
  Issuance: {
    '*': and(fallbackRule, or(and(isIssuee, issuanceIsToAuthenticatedUser), not(isIssuee))),
  },
  Presentation: {
    '*': and(fallbackRule, or(and(isIssuee, presentationIsByAuthenticatedUser), not(isIssuee))),
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
    '*': or(isAsyncIssuer, and(isIssuee, asyncIssuanceIsToAuthenticatedUser)),
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
  Branding: {
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
