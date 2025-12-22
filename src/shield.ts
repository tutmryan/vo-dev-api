import { type ShieldSchema } from '@makerx/graphql-core'
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
  isValidLimitedMdocPresentationRequest,
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
  anyUserRule,
  fallbackRule,
  fallbackWithSupportAgentRule,
  isAllowedToCreateAndDeleteIdentities,
  isAllowedToRevokeCredentials,
  isAllowedToViewAsyncIssuanceRequests,
  isAllowedToViewIssuances,
  isAllowedToViewPresentations,
  isApprovalRequestAdminUser,
  isAsyncIssuer,
  isContractAdminApp,
  isCredentialAdminUser,
  isCredentialRevoker,
  isInstanceAdminUser,
  isIssuanceApp,
  isIssuee,
  isIssuer,
  isIssuerUser,
  isOidcAdminUser,
  isPartnerAdminUser,
  isPresentationApp,
  isSupportAgentUser,
  isUserWithReadPermissions,
} from './shield-rules'

export const rules: ShieldSchema<Resolvers> = {
  Query: {
    '*': isUserWithReadPermissions,
    actionedApprovalData: or(isApprovalRequestAdminUser, isApprovalRequestApp),
    applicationLabelConfigs: isInstanceAdminUser,
    approvalRequest: or(isApprovalRequestAdminUser, and(isLimitedApprovalApp, hasApprovalRequestPresentationAndMatchesApprovalRequestId)),
    approvalRequestTypes: isApprovalRequestAdminUser,
    asyncIssuanceContact: or(isIssuerUser, isSupportAgentUser),
    asyncIssuanceRequest: or(isAllowedToViewAsyncIssuanceRequests, isIssuee),
    authority: or(isUserWithReadPermissions, isIssuee),
    conciergeBranding: allow,
    contract: or(anyUserRule, isIssuanceApp, isPresentationApp, isContractAdminApp, isValidLimitedContractRequest),
    corsOriginConfigs: isInstanceAdminUser,
    discovery: or(anyUserRule, isIssuee),
    emailSenderConfig: isInstanceAdminUser,
    findApprovalRequests: isApprovalRequestAdminUser,
    findAsyncIssuanceRequests: isAllowedToViewIssuances,
    findCommunications: anyUserRule,
    findContracts: or(anyUserRule, isIssuanceApp, isPresentationApp, isContractAdminApp, isLimitedListContractsApp),
    findIdentities: anyUserRule,
    findIdentityStores: or(isInstanceAdminUser, isAllowedToCreateAndDeleteIdentities),
    findIssuances: isAllowedToViewIssuances,
    findNetworkIssuers: isPartnerAdminUser,
    findOidcClients: isUserWithReadPermissions,
    findOidcResources: isUserWithReadPermissions,
    findOidcClaimMappings: isUserWithReadPermissions,
    findPresentations: isAllowedToViewPresentations,
    findTemplates: or(isUserWithReadPermissions, isContractAdminApp),
    findWallets: isAllowedToViewPresentations,
    healthcheck: allow,
    identity: or(anyUserRule, isIssuanceApp, isPresentationApp, isValidLimitedIdentityRequest),
    identitiesByIdentifiers: or(anyUserRule, isIssuanceApp, isLimitedIssuanceApp, hasTokenAcquisitionRoleRequiringIdentityAccess),
    identityByIdentifier: or(anyUserRule, isIssuanceApp, isLimitedIssuanceApp, hasTokenAcquisitionRoleRequiringIdentityAccess),
    identityStore: or(isInstanceAdminUser, isAllowedToCreateAndDeleteIdentities),
    issuance: or(isAllowedToViewIssuances, isIssuee),
    issuanceCount: anyUserRule,
    issuanceCountByUser: anyUserRule,
    me: allow,
    networkContracts: isPartnerAdminUser,
    oidcClient: isUserWithReadPermissions,
    photoCaptureStatus: or(isIssuer, isLimitedAsyncIssuancePhotoCaptureUser),
    presentation: anyUserRule,
    presentationCount: anyUserRule,
    presentationCountByUser: anyUserRule,
    template: or(isUserWithReadPermissions, isContractAdminApp),
    templateCombinedData: or(isUserWithReadPermissions, isContractAdminApp),
    testIdentityStoreGraphClient: isInstanceAdminUser,
    verifyPresentation: isAllowedToViewPresentations,
    wallet: isAllowedToViewPresentations,
  },
  Mutation: {
    '*': isCredentialAdminUser,
    acquireAsyncIssuanceToken: allow,
    acquireLimitedAccessToken: and(hasTokenAcquisitionRole, isValidAcquireLimitedAccessTokenRequest),
    acquireLimitedApprovalToken: allow,
    acquireLimitedPhotoCaptureToken: allow,
    actionApprovalRequest: and(isLimitedApprovalApp, hasApprovalRequestPresentationAndMatchesApprovalRequestId),
    cancelApprovalRequest: or(isApprovalRequestAdminUser, isApprovalRequestApp),
    cancelAsyncIssuanceRequest: or(isAsyncIssuer, isSupportAgentUser),
    cancelAsyncIssuanceRequests: or(isAsyncIssuer, isSupportAgentUser),
    capturePhoto: isValidCapturePhoto,
    createApprovalRequest: isApprovalRequestApp,
    createAsyncIssuanceRequest: isAsyncIssuer,
    createContract: or(isCredentialAdminUser, isContractAdminApp),
    createIdentityStore: isInstanceAdminUser,
    createIssuanceRequest: or(isIssuerUser, isIssuanceApp, isValidLimitedIssuanceRequest),
    createIssuanceRequestForAsyncIssuance: or(isIssuee, isValidCreateIssuanceRequestForAsyncIssuanceRequest),
    createOidcClaimMapping: isOidcAdminUser,
    createOidcClient: isOidcAdminUser,
    createOidcClientResource: isOidcAdminUser,
    createOidcResource: isOidcAdminUser,
    createPartner: isPartnerAdminUser,
    createPhotoCaptureRequest: or(isIssuerUser, isIssuanceApp, isValidLimitedIssuancePhotoCaptureRequest),
    createPresentationRequest: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedPresentationRequest),
    createPresentationRequestForApproval: isValidLimitedPresentationRequestForApproval,
    createPresentationRequestForAuthn: isValidOidcAuthnPresentationRequest,
    createMDocPresentationRequest: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedMdocPresentationRequest),
    processMDocPresentationResponse: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedMdocPresentationRequest),
    createTemplate: or(isCredentialAdminUser, isContractAdminApp),
    deleteConciergeBranding: isInstanceAdminUser,
    deleteContract: or(isCredentialAdminUser, isContractAdminApp),
    deleteIdentities: isAllowedToCreateAndDeleteIdentities,
    deleteOidcClaimMapping: isOidcAdminUser,
    deleteOidcClient: isOidcAdminUser,
    deleteOidcClientResource: isOidcAdminUser,
    deleteOidcResource: isOidcAdminUser,
    deleteTemplate: or(isCredentialAdminUser, isContractAdminApp),
    deprecateContract: or(isCredentialAdminUser, isContractAdminApp),
    generateOidcClientSecret: isOidcAdminUser,
    import: or(isCredentialAdminUser, isContractAdminApp),
    provisionContract: or(isCredentialAdminUser, isContractAdminApp),
    resendAsyncIssuanceNotification: or(isAsyncIssuer, isSupportAgentUser),
    resendAsyncIssuanceNotifications: or(isAsyncIssuer, isSupportAgentUser),
    resumeIdentityStore: isInstanceAdminUser,
    resumePartner: isPartnerAdminUser,
    revokeContractIssuances: isAllowedToRevokeCredentials,
    revokeIdentityIssuances: isAllowedToRevokeCredentials,
    revokeIssuance: isAllowedToRevokeCredentials,
    revokeIssuances: isAllowedToRevokeCredentials,
    revokeUserIssuances: isAllowedToRevokeCredentials,
    revokeWalletIssuances: isAllowedToRevokeCredentials,
    saveConciergeBranding: isInstanceAdminUser,
    saveIdentity: isAllowedToCreateAndDeleteIdentities,
    sendAsyncIssuanceVerification: allow,
    setApplicationLabelConfigs: isInstanceAdminUser,
    setCorsOriginConfigs: isInstanceAdminUser,
    setEmailSenderConfig: isInstanceAdminUser,
    suspendIdentityStore: isInstanceAdminUser,
    suspendPartner: isPartnerAdminUser,
    testServices: isInstanceAdminUser,
    updateApprovalRequest: isApprovalRequestApp,
    updateAsyncIssuanceContact: or(isAsyncIssuer, isSupportAgentUser),
    updateContract: or(isCredentialAdminUser, isContractAdminApp),
    updateIdentityStore: isInstanceAdminUser,
    updateOidcClaimMapping: isOidcAdminUser,
    updateOidcClient: isOidcAdminUser,
    updateOidcClientClaimMappings: isOidcAdminUser,
    updateOidcClientResource: isOidcAdminUser,
    updateOidcResource: isOidcAdminUser,
    updateConciergeClientBranding: or(isOidcAdminUser, isInstanceAdminUser),
    updatePartner: isPartnerAdminUser,
    updateTemplate: or(isCredentialAdminUser, isContractAdminApp),
  },
  // Subscription subscribe rules currently depend on patched graphql-middleware
  Subscription: {
    // Lock down presentations and issuance event subscriptions to the app that created the request (or admins)
    '*': isCredentialAdminUser,
    backgroundJobEvent: fallbackWithSupportAgentRule,
    issuanceEvent: or(
      isIssuerUser,
      isCredentialAdminUser,
      and(requestIdFilterDefined, or(isIssuanceApp, isLimitedIssuanceApp, isLimitedAsyncIssuanceApp, isIssuee)),
    ),
    photoCaptureEvent: or(isIssuer, isLimitedAsyncIssuancePhotoCaptureUser),
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
  },
  AccessTokenResponse: {
    '*': hasTokenAcquisitionRole,
  },
  ActionedApprovalData: {
    '*': or(isApprovalRequestAdminUser, isApprovalRequestApp),
  },
  ActionedBy: {
    '*': or(isApprovalRequestAdminUser, isApprovalRequestApp),
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
  AsyncIssuanceContact: {
    '*': or(isIssuerUser, isSupportAgentUser),
  },
  AsyncIssuanceErrorResponse: {
    '*': anyUserRule,
  },
  AsyncIssuanceRequest: {
    '*': or(isAsyncIssuer, and(isIssuee, asyncIssuanceIsToAuthenticatedUser), isSupportAgentUser, isUserWithReadPermissions),
  },
  AsyncIssuanceRequestResponse: {
    '*': fallbackWithSupportAgentRule,
  },
  AsyncIssuanceResponse: {
    '*': fallbackWithSupportAgentRule,
  },
  AsyncIssuanceTokenResponse: {
    '*': allow,
  },
  BackgroundJobEvent: {
    '*': fallbackWithSupportAgentRule,
  },
  BackgroundJobProgressEvent: {
    '*': fallbackWithSupportAgentRule,
  },
  BackgroundJobErrorEvent: {
    '*': fallbackWithSupportAgentRule,
  },
  BackgroundJobCompletedEvent: {
    '*': fallbackWithSupportAgentRule,
  },
  BackgroundJobActiveEvent: {
    '*': fallbackWithSupportAgentRule,
  },
  BackgroundJobEventData: {
    '*': fallbackWithSupportAgentRule,
  },
  Branding: {
    '*': allow,
  },
  Communication: {
    '*': fallbackWithSupportAgentRule,
  },
  Contact: {
    '*': fallbackWithSupportAgentRule,
  },
  Contract: {
    '*': fallbackWithSupportAgentRule,
    asyncIssuanceRequests: isAllowedToViewAsyncIssuanceRequests,
    issuances: isAllowedToViewIssuances,
    presentations: isAllowedToViewPresentations,
  },
  ContractCount: {
    '*': fallbackWithSupportAgentRule,
  },
  ContractDisplayClaim: {
    '*': fallbackWithSupportAgentRule,
  },
  ContractDisplayConsent: {
    '*': fallbackWithSupportAgentRule,
  },
  ContractDisplayCredential: {
    '*': fallbackWithSupportAgentRule,
  },
  ContractDisplayCredentialLogo: {
    '*': fallbackWithSupportAgentRule,
  },
  ContractDisplayModel: {
    '*': fallbackWithSupportAgentRule,
  },
  Discovery: {
    '*': fallbackWithSupportAgentRule,
  },
  FaceCheckResult: {
    '*': fallbackWithSupportAgentRule,
  },
  FaceCheckValidation: {
    '*': fallbackWithSupportAgentRule,
  },
  Identity: {
    '*': or(
      anyUserRule,
      isIssuanceApp,
      isPresentationApp,
      hasTokenAcquisitionRoleRequiringIdentityAccess,
      isLimitedAccessApp,
      isOidcAuthnClient,
      isIssuee,
    ),
    asyncIssuanceRequests: or(isAllowedToViewAsyncIssuanceRequests, and(isIssuee, identityIsAuthenticatedUser)),
    issuances: or(isAllowedToViewIssuances, and(isIssuee, identityIsAuthenticatedUser)),
    presentations: or(isAllowedToViewPresentations, and(isIssuee, identityIsAuthenticatedUser)),
  },
  IdentityIssuer: {
    '*': fallbackWithSupportAgentRule,
  },
  Issuance: {
    '*': and(or(fallbackWithSupportAgentRule, isCredentialRevoker), or(and(isIssuee, issuanceIsToAuthenticatedUser), not(isIssuee))),
  },
  ListValidation: {
    '*': fallbackWithSupportAgentRule,
  },
  Me: {
    '*': fallbackWithSupportAgentRule,
  },
  MsGraphFailure: {
    '*': fallbackWithSupportAgentRule,
  },
  NumberValidation: {
    '*': fallbackWithSupportAgentRule,
  },
  OidcClaimMapping: {
    '*': fallbackRule,
  },
  OidcClient: {
    '*': fallbackWithSupportAgentRule,
  },
  OidcClientResource: {
    '*': fallbackRule,
  },
  OidcResource: {
    '*': fallbackRule,
  },
  PhotoCaptureEventData: {
    '*': or(isIssuer, isLimitedAsyncIssuancePhotoCaptureUser),
  },
  PhotoCaptureTokenResponse: {
    '*': allow,
  },
  Presentation: {
    '*': and(fallbackWithSupportAgentRule, or(and(isIssuee, presentationIsByAuthenticatedUser), not(isIssuee))),
  },
  PresentedCredential: {
    '*': fallbackWithSupportAgentRule,
  },
  RegexValidation: {
    '*': fallbackWithSupportAgentRule,
  },
  RequestConfigurationValidation: {
    '*': fallbackWithSupportAgentRule,
  },
  RequestedClaimConstraint: {
    '*': fallbackWithSupportAgentRule,
  },
  RequestedConfiguration: {
    '*': fallbackWithSupportAgentRule,
  },
  RequestedCredential: {
    '*': fallbackWithSupportAgentRule,
  },
  SendAsyncIssuanceVerificationResponse: {
    '*': allow,
  },
  Template: {
    '*': fallbackWithSupportAgentRule,
  },
  TemplateDisplayClaim: {
    '*': fallbackWithSupportAgentRule,
  },
  TemplateDisplayCredential: {
    '*': fallbackWithSupportAgentRule,
  },
  TemplateDisplayCredentialLogo: {
    '*': fallbackWithSupportAgentRule,
  },
  TemplateDisplayModel: {
    '*': fallbackWithSupportAgentRule,
  },
  TemplateParentData: {
    '*': fallbackWithSupportAgentRule,
  },
  TextValidation: {
    '*': fallbackWithSupportAgentRule,
  },
  User: {
    '*': fallbackWithSupportAgentRule,
  },
  UserCount: {
    '*': fallbackWithSupportAgentRule,
  },
  Wallet: {
    '*': fallbackWithSupportAgentRule,
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
