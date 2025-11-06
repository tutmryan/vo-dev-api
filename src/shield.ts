import type { ShieldSchema } from '@makerx/graphql-core'
import { isDev, isLocalDev } from '@makerx/node-common'
import { GraphQLError } from 'graphql'
import { allow, and, not, or, shield } from 'graphql-shield'
import type { IRules } from 'graphql-shield/typings/types'
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
  isValidLimitedPresentationRequestForApproval,
} from './features/limited-approval-tokens/shield-rules'
import {
  isLimitedAsyncIssuanceApp,
  isLimitedAsyncIssuancePhotoCaptureUser,
  isValidCreateIssuanceRequestForAsyncIssuanceRequest,
} from './features/limited-async-issuance-tokens/shield-rules'
import { isOidcAuthnClient, isValidOidcAuthnPresentationRequest } from './features/oidc-provider/shield-rules'
import { isValidCapturePhoto, isValidLimitedIssuancePhotoCaptureRequest } from './features/photo-capture/shield-rules'
import type { Resolvers } from './generated/graphql'
import {
  fallbackRule,
  isAllowedToCreateAndDeleteIdentities,
  isAllowedToViewAsyncIssuanceRequests,
  isAllowedToViewIssuances,
  isAllowedToViewPresentations,
  isApprovalRequestAdminUser,
  isAsyncIssuer,
  isContractAdminApp,
  isCredentialAdminUser,
  isInstanceAdminUser,
  isIssuanceApp,
  isIssuee,
  isIssuer,
  isIssuerUser,
  isOidcAdminUser,
  isPartnerAdminUser,
  isPresentationApp,
  isUserWithReadPermissions,
} from './shield-rules'

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
    identityStore: or(isInstanceAdminUser, isAllowedToCreateAndDeleteIdentities),
    testIdentityStoreGraphClient: isInstanceAdminUser,
    findIdentityStores: or(isInstanceAdminUser, isAllowedToCreateAndDeleteIdentities),
    applicationLabelConfigs: isInstanceAdminUser,
    corsOriginConfigs: isInstanceAdminUser,
    emailSenderConfig: isInstanceAdminUser,
    issuance: or(isAllowedToViewIssuances, isIssuee),
    findIssuances: isAllowedToViewIssuances,
    findAsyncIssuanceRequests: isAllowedToViewAsyncIssuanceRequests,
    findPresentations: isAllowedToViewPresentations,
    verifyPresentation: isAllowedToViewPresentations,
    wallet: isAllowedToViewPresentations,
    findWallets: isAllowedToViewPresentations,
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
    createIdentityStore: isInstanceAdminUser,
    updateIdentityStore: isInstanceAdminUser,
    suspendIdentityStore: isInstanceAdminUser,
    resumeIdentityStore: isInstanceAdminUser,
    setApplicationLabelConfigs: isInstanceAdminUser,
    setCorsOriginConfigs: isInstanceAdminUser,
    setEmailSenderConfig: isInstanceAdminUser,
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
    generateOidcClientSecret: isOidcAdminUser,
    revokeIssuance: or(isCredentialAdminUser, isContractAdminApp),
    revokeIssuances: or(isCredentialAdminUser, isContractAdminApp),
    revokeContractIssuances: or(isCredentialAdminUser, isContractAdminApp),
    revokeIdentityIssuances: or(isCredentialAdminUser, isContractAdminApp),
    revokeUserIssuances: or(isCredentialAdminUser, isContractAdminApp),
    revokeWalletIssuances: or(isCredentialAdminUser, isContractAdminApp),
    testServices: isInstanceAdminUser,
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
