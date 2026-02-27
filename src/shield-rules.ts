import { or } from 'graphql-shield'
import {
  hasTokenAcquisitionRoleRequiringIdentityAccess,
  isLimitedAccessApp,
  isLimitedIssuanceApp,
  isValidLimitedAccessIssuanceFilter,
  isValidLimitedAccessPresentationFilter,
} from './features/limited-access-tokens'
import { isLimitedAsyncIssuanceApp, isValidLimitedAsyncIssuanceIssuanceFilter } from './features/limited-async-issuance-tokens/shield-rules'
import {
  isLimitedPresentationFlowApp,
  isValidLimitedPresentationFlowPresentationFilter,
} from './features/limited-presentation-flow-tokens/shield-rules'
import { isOidcAuthnClient, isValidOidcAuthnPresentationFilter } from './features/oidc-provider/shield-rules'
import { AppRoles, OidcScopes, UserRoles } from './roles'
import { hasAnyRoleRuleWithName, hasApiResourceScopeRule, hasRoleRule } from './util/shield-utils'

// Exclude Support Agent from blanket read to allow explicit grants only
export const isUserWithReadPermissions = hasAnyRoleRuleWithName(
  'isUserWithReadPermissions',
  UserRoles.reader,
  UserRoles.issuer,
  UserRoles.credentialAdmin,
  UserRoles.partnerAdmin,
  UserRoles.oidcAdmin,
  UserRoles.instanceAdmin,
)

// user roles
export const isIssuerUser = hasRoleRule(UserRoles.issuer)
export const isCredentialAdminUser = hasRoleRule(UserRoles.credentialAdmin)
export const isPartnerAdminUser = hasRoleRule(UserRoles.partnerAdmin)
export const isOidcAdminUser = hasRoleRule(UserRoles.oidcAdmin)
export const isInstanceAdminUser = hasRoleRule(UserRoles.instanceAdmin)
export const isSupportAgentUser = hasRoleRule(UserRoles.supportAgent)

// app roles
export const isIssuanceApp = hasRoleRule(AppRoles.issue, 'isIssuanceApp')
export const isPresentationApp = hasRoleRule(AppRoles.present, 'isPresentationApp')
export const isContractAdminApp = hasRoleRule(AppRoles.contractAdmin, 'isContractAdminApp')

// user app common roles
export const isCredentialRevoker = hasRoleRule(UserRoles.credentialRevoker)

// api resource scope rules
export const isIssuee = hasApiResourceScopeRule(OidcScopes.issuee)

export const isIssuer = or(isIssuerUser, isIssuanceApp, isLimitedIssuanceApp)
export const isAsyncIssuer = or(isIssuerUser, isIssuanceApp)

export const fallbackRule = or(
  isUserWithReadPermissions,
  isIssuanceApp,
  isPresentationApp,
  isContractAdminApp,
  isLimitedAccessApp,
  isLimitedPresentationFlowApp,
  isLimitedAsyncIssuanceApp,
  isOidcAuthnClient,
  isIssuee,
)

export const anyUserRule = or(isUserWithReadPermissions, isSupportAgentUser)
export const fallbackWithSupportAgentRule = or(fallbackRule, isSupportAgentUser)

// issuance and presentation access rules
export const isAllowedToViewIssuances = or(
  isUserWithReadPermissions,
  isIssuanceApp,
  isValidLimitedAccessIssuanceFilter,
  isValidLimitedAsyncIssuanceIssuanceFilter,
  isSupportAgentUser,
)
export const isAllowedToViewPresentations = or(
  isUserWithReadPermissions,
  isPresentationApp,
  isValidLimitedAccessPresentationFilter,
  isValidLimitedPresentationFlowPresentationFilter,
  isValidOidcAuthnPresentationFilter,
  isSupportAgentUser,
)

export const isAllowedToCreateAndDeleteIdentities = or(
  isIssuerUser,
  isIssuanceApp,
  isLimitedIssuanceApp,
  isCredentialAdminUser,
  hasTokenAcquisitionRoleRequiringIdentityAccess,
)

export const isAllowedToRevokeCredentials = or(isCredentialAdminUser, isContractAdminApp, isCredentialRevoker)

export const isAllowedToViewAsyncIssuanceRequests = or(isUserWithReadPermissions, isIssuanceApp, isSupportAgentUser)
