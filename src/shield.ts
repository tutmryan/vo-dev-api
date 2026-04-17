import { type ShieldSchema } from '@makerx/graphql-core'
import { isDev, isLocalDev } from '@makerx/node-common'
import { GraphQLError } from 'graphql'
import { allow, and, not, or, shield } from 'graphql-shield'
import type { IRules } from 'graphql-shield/typings/types'
import {
  asyncIssuanceIsToAuthenticatedUser,
  identityIsAuthenticatedUser,
  issuanceIsToAuthenticatedUser,
  presentationFlowIsToAuthenticatedUser,
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
  isLimitedAsyncIssuanceApp,
  isLimitedAsyncIssuancePhotoCaptureUser,
  isValidCreateIssuanceRequestForAsyncIssuanceRequest,
} from './features/limited-async-issuance-tokens/shield-rules'
import {
  hasPresentationFlowPresentationAndMatchesId,
  isLimitedPresentationFlowApp,
  isValidLimitedCancelPresentationFlow,
  isValidLimitedCreatePresentationRequestForPresentationFlow,
  isValidLimitedPresentationFlow,
} from './features/limited-presentation-flow-tokens/shield-rules'
import { isOidcAuthnClient, isValidOidcAuthnPresentationRequest } from './features/oidc-provider/shield-rules'
import { isValidCapturePhoto, isValidLimitedIssuancePhotoCaptureRequest } from './features/photo-capture/shield-rules'
import {
  canCancelPresentationFlow,
  canCreatePresentationFlow,
  canCreatePresentationFlowTemplate,
  canDeletePresentationFlowTemplate,
  canReadPresentationFlow,
  canReadPresentationFlowTemplate,
  canUpdatePresentationFlowTemplate,
} from './features/presentation-flow/shield-rules'
import type { Resolvers } from './generated/graphql'
import { logger } from './logger'
import {
  anyUserRule,
  fallbackRule,
  fallbackWithSupportAgentRule,
  isAllowedToCreateAndDeleteIdentities,
  isAllowedToRevokeCredentials,
  isAllowedToViewAsyncIssuanceRequests,
  isAllowedToViewIssuances,
  isAllowedToViewPresentations,
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
    accessPackages: isCredentialAdminUser,
    actionedPresentationFlowData: or(canReadPresentationFlow, isValidLimitedPresentationFlow),
    applicationLabelConfigs: isInstanceAdminUser,
    presentationFlow: or(canReadPresentationFlow, isValidLimitedPresentationFlow),
    asyncIssuanceContact: or(isIssuerUser, isSupportAgentUser),
    presentationFlowContact: canCreatePresentationFlow,
    asyncIssuanceRequest: or(isAllowedToViewAsyncIssuanceRequests, isIssuee),
    authority: or(isUserWithReadPermissions, isIssuee),
    conciergeBranding: allow,
    composerBranding: allow,
    contract: or(anyUserRule, isIssuanceApp, isPresentationApp, isContractAdminApp, isValidLimitedContractRequest),
    corsOriginConfigs: isInstanceAdminUser,
    discovery: or(anyUserRule, isIssuee),
    instanceSetting: isInstanceAdminUser,
    emailSenderConfig: isInstanceAdminUser,
    findPresentationFlows: canReadPresentationFlow,
    presentationFlowTemplate: canReadPresentationFlowTemplate,
    findPresentationFlowTemplates: canReadPresentationFlowTemplate,
    findAsyncIssuanceRequests: isAllowedToViewIssuances,
    findCommunications: anyUserRule,
    findContracts: or(anyUserRule, isIssuanceApp, isPresentationApp, isContractAdminApp, isLimitedListContractsApp),
    findIdentities: or(anyUserRule, isIssuanceApp),
    findIdentityStores: or(isInstanceAdminUser, isAllowedToCreateAndDeleteIdentities),
    findIssuances: isAllowedToViewIssuances,
    findNetworkIssuers: isPartnerAdminUser,
    findOidcClients: isUserWithReadPermissions,
    findOidcResources: isUserWithReadPermissions,
    findOidcClaimMappings: isUserWithReadPermissions,
    findOidcIdentityResolvers: isUserWithReadPermissions,
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
    microsoftEntraTemporaryAccessPassIssuanceConfiguration: allow,
    microsoftEntraTemporaryAccessPassIssuanceConfigurations: allow,
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
    acquireLimitedPresentationFlowToken: allow,
    acquireLimitedPhotoCaptureToken: allow,
    cancelAsyncIssuanceRequest: or(isAsyncIssuer, isSupportAgentUser),
    cancelAsyncIssuanceRequests: or(isAsyncIssuer, isSupportAgentUser),
    capturePhoto: isValidCapturePhoto,
    createPresentationFlow: canCreatePresentationFlow,
    createAsyncIssuanceRequest: isAsyncIssuer,
    createContract: or(isCredentialAdminUser, isContractAdminApp),
    createIdentityStore: isInstanceAdminUser,
    createIssuanceRequest: or(isIssuerUser, isIssuanceApp, isValidLimitedIssuanceRequest),
    createIssuanceRequestForAsyncIssuance: or(isIssuee, isValidCreateIssuanceRequestForAsyncIssuanceRequest),
    createOidcClaimMapping: isOidcAdminUser,
    createOidcClient: isOidcAdminUser,
    createOidcClientResource: isOidcAdminUser,
    createOidcIdentityResolver: isOidcAdminUser,
    createOidcResource: isOidcAdminUser,
    createPartner: isPartnerAdminUser,
    createPhotoCaptureRequest: or(isIssuerUser, isIssuanceApp, isValidLimitedIssuancePhotoCaptureRequest),
    createPresentationRequest: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedPresentationRequest),
    createPresentationRequestForPresentationFlow: or(canCreatePresentationFlow, isValidLimitedCreatePresentationRequestForPresentationFlow),
    submitPresentationFlowActions: or(
      canReadPresentationFlow,
      and(isLimitedPresentationFlowApp, hasPresentationFlowPresentationAndMatchesId),
    ),
    cancelPresentationFlow: or(canCancelPresentationFlow, isValidLimitedCancelPresentationFlow),
    createPresentationFlowTemplate: canCreatePresentationFlowTemplate,
    updatePresentationFlowTemplate: canUpdatePresentationFlowTemplate,
    deletePresentationFlowTemplate: canDeletePresentationFlowTemplate,
    createPresentationRequestForAuthn: isValidOidcAuthnPresentationRequest,
    createMDocPresentationRequest: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedMdocPresentationRequest),
    processMDocPresentationResponse: or(isUserWithReadPermissions, isPresentationApp, isValidLimitedMdocPresentationRequest),
    createMicrosoftEntraTemporaryAccessPassIssuanceConfiguration: isInstanceAdminUser,
    createTemplate: or(isCredentialAdminUser, isContractAdminApp),
    deleteConciergeBranding: isInstanceAdminUser,
    deleteComposerBranding: isInstanceAdminUser,
    deleteContract: or(isCredentialAdminUser, isContractAdminApp),
    deleteIdentities: isAllowedToCreateAndDeleteIdentities,
    deleteOidcClaimMapping: isOidcAdminUser,
    deleteOidcClient: isOidcAdminUser,
    deleteOidcClientResource: isOidcAdminUser,
    deleteOidcIdentityResolver: isOidcAdminUser,
    deleteOidcResource: isOidcAdminUser,
    deleteMicrosoftEntraTemporaryAccessPassIssuanceConfiguration: isInstanceAdminUser,
    deleteTemplate: or(isCredentialAdminUser, isContractAdminApp),
    deprecateContract: or(isCredentialAdminUser, isContractAdminApp),
    generateOidcClientSecret: isOidcAdminUser,
    import: or(isCredentialAdminUser, isContractAdminApp),
    provisionContract: or(isCredentialAdminUser, isContractAdminApp),
    selfIssueMicrosoftEntraTemporaryAccessPass: or(anyUserRule, isIssuee),
    resendAsyncIssuanceNotification: or(isAsyncIssuer, isSupportAgentUser),
    resendAsyncIssuanceNotifications: or(isAsyncIssuer, isSupportAgentUser),
    resendPresentationFlowNotification: canCreatePresentationFlow,
    updatePresentationFlowContact: canCreatePresentationFlow,
    resumeIdentityStore: isInstanceAdminUser,
    resumePartner: isPartnerAdminUser,
    revokeContractIssuances: isAllowedToRevokeCredentials,
    revokeIdentityIssuances: isAllowedToRevokeCredentials,
    revokeIssuance: isAllowedToRevokeCredentials,
    revokeIssuances: isAllowedToRevokeCredentials,
    revokeUserIssuances: isAllowedToRevokeCredentials,
    revokeWalletIssuances: isAllowedToRevokeCredentials,
    saveConciergeBranding: isInstanceAdminUser,
    saveComposerBranding: isInstanceAdminUser,
    saveIdentity: isAllowedToCreateAndDeleteIdentities,
    sendAsyncIssuanceVerification: allow,
    setApplicationLabelConfigs: isInstanceAdminUser,
    setCorsOriginConfigs: isInstanceAdminUser,
    setEmailSenderConfig: isInstanceAdminUser,
    setInstanceSetting: isInstanceAdminUser,
    suspendIdentityStore: isInstanceAdminUser,
    suspendPartner: isPartnerAdminUser,
    testServices: isInstanceAdminUser,
    updateAsyncIssuanceContact: or(isAsyncIssuer, isSupportAgentUser),
    updateContract: or(isCredentialAdminUser, isContractAdminApp),
    updateIdentityStore: isInstanceAdminUser,
    updateOidcClaimMapping: isOidcAdminUser,
    updateOidcClient: isOidcAdminUser,
    updateOidcClientClaimMappings: isOidcAdminUser,
    updateOidcClientIdentityResolvers: isOidcAdminUser,
    updateOidcClientResource: isOidcAdminUser,
    updateOidcIdentityResolver: isOidcAdminUser,
    updateOidcResource: isOidcAdminUser,
    updateConciergeClient: or(isOidcAdminUser, isInstanceAdminUser),
    updatePartner: isPartnerAdminUser,
    updateMicrosoftEntraTemporaryAccessPassIssuanceConfiguration: isInstanceAdminUser,
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
    presentationFlowEvent: canReadPresentationFlow,
    presentationEvent: or(
      isCredentialAdminUser,
      and(
        requestIdFilterDefined,
        or(
          isUserWithReadPermissions,
          isPresentationApp,
          isLimitedPresentationApp,
          isLimitedAnonymousPresentationApp,
          isLimitedPresentationFlowApp,
          isOidcAuthnClient,
        ),
      ),
    ),
  },
  AccessTokenResponse: {
    '*': hasTokenAcquisitionRole,
  },
  ActionedPresentationFlowData: {
    '*': or(canReadPresentationFlow, isValidLimitedPresentationFlow),
  },
  ActionedBy: {
    '*': or(canReadPresentationFlow, isValidLimitedPresentationFlow),
  },
  PresentationFlow: {
    '*': or(
      canReadPresentationFlow,
      canCreatePresentationFlow,
      canCancelPresentationFlow,
      isLimitedPresentationFlowApp,
      isValidLimitedPresentationFlow,
      and(isIssuee, presentationFlowIsToAuthenticatedUser),
    ),
  },
  PresentationFlowResponse: {
    '*': canCreatePresentationFlow,
  },
  PresentationFlowTemplate: {
    '*': or(
      canCreatePresentationFlowTemplate,
      canReadPresentationFlowTemplate,
      canUpdatePresentationFlowTemplate,
      canDeletePresentationFlowTemplate,
    ),
  },
  PresentationFlowTemplateFieldVisibility: {
    '*': or(
      canCreatePresentationFlowTemplate,
      canReadPresentationFlowTemplate,
      canUpdatePresentationFlowTemplate,
      canDeletePresentationFlowTemplate,
    ),
  },
  PresentationFlowTemplateNotification: {
    '*': or(
      canCreatePresentationFlowTemplate,
      canReadPresentationFlowTemplate,
      canUpdatePresentationFlowTemplate,
      canDeletePresentationFlowTemplate,
    ),
  },
  PresentationFlowTokenResponse: {
    '*': allow,
  },
  AsyncIssuanceContact: {
    '*': or(isIssuerUser, isSupportAgentUser),
  },
  PresentationFlowContact: {
    '*': canCreatePresentationFlow,
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
    presentationFlows: or(canReadPresentationFlow, and(isIssuee, identityIsAuthenticatedUser)),
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
  OidcClientClaimConstraint: {
    '*': fallbackWithSupportAgentRule,
  },
  OidcClientVcPolicy: {
    '*': fallbackWithSupportAgentRule,
  },
  OidcClientResource: {
    '*': fallbackRule,
  },
  OidcIdentityResolver: {
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
  SelfServiceAction: {
    '*': fallbackWithSupportAgentRule,
  },
  MicrosoftEntraTemporaryAccessPass: {
    '*': fallbackWithSupportAgentRule,
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
  MicrosoftEntraTemporaryAccessPassIssuanceConfiguration: {
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
  const debug = isLocalDev || isDev

  return shield(x as IRules, {
    fallbackRule,
    debug,
    allowExternalErrors: true, // we don't want shield to catch and convert all errors to: Not Authorised!
    fallbackError: (thrownThing, _parent, _args, _context, info) => {
      const location = `${info.parentType.name}.${info.fieldName}`

      if (debug) {
        logger.warn(`GraphQL Shield rejected operation`, { name: info.operation.name?.value, location, path: info.path, thrownThing })
      }

      return new GraphQLError('Not Authorized!', {
        extensions: { code: 'FORBIDDEN', http: { status: 403 } },
      })
    },
  })
}
