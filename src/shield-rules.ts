import { or } from 'graphql-shield'
import {
  hasTokenAcquisitionRoleRequiringIdentityAccess,
  isLimitedAccessApp,
  isLimitedIssuanceApp,
  isValidLimitedAccessIssuanceFilter,
  isValidLimitedAccessPresentationFilter,
} from './features/limited-access-tokens'
import { isLimitedApprovalApp, isValidLimitedApprovalPresentationFilter } from './features/limited-approval-tokens/shield-rules'
import { isLimitedAsyncIssuanceApp, isValidLimitedAsyncIssuanceIssuanceFilter } from './features/limited-async-issuance-tokens/shield-rules'
import { isOidcAuthnClient, isValidOidcAuthnPresentationFilter } from './features/oidc-provider/shield-rules'
import { AppRoles, OidcScopes, UserRoles } from './roles'
import { hasAnyRoleRuleWithName, hasApiResourceScopeRule, hasRoleRule } from './util/shield-utils'

export const isUserWithReadPermissions = hasAnyRoleRuleWithName('isUserWithReadPermissions', ...Object.values(UserRoles))

// user roles
export const isIssuerUser = hasRoleRule(UserRoles.issuer)
export const isCredentialAdminUser = hasRoleRule(UserRoles.credentialAdmin)
export const isPartnerAdminUser = hasRoleRule(UserRoles.partnerAdmin)
export const isApprovalRequestAdminUser = hasRoleRule(UserRoles.approvalRequestAdmin)
export const isOidcAdminUser = hasRoleRule(UserRoles.oidcAdmin)
export const isInstanceAdminUser = hasRoleRule(UserRoles.instanceAdmin)

// app roles
export const isIssuanceApp = hasRoleRule(AppRoles.issue, 'isIssuanceApp')
export const isPresentationApp = hasRoleRule(AppRoles.present, 'isPresentationApp')
export const isContractAdminApp = hasRoleRule(AppRoles.contractAdmin, 'isContractAdminApp')

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
  isLimitedApprovalApp,
  isLimitedAsyncIssuanceApp,
  isOidcAuthnClient,
  isIssuee,
)

// issuance and presentation access rules
export const isAllowedToViewIssuances = or(
  isUserWithReadPermissions,
  isIssuanceApp,
  isValidLimitedAccessIssuanceFilter,
  isValidLimitedAsyncIssuanceIssuanceFilter,
)
export const isAllowedToViewPresentations = or(
  isUserWithReadPermissions,
  isPresentationApp,
  isValidLimitedAccessPresentationFilter,
  isValidLimitedApprovalPresentationFilter,
  isValidOidcAuthnPresentationFilter,
)

export const isAllowedToCreateAndDeleteIdentities = or(
  isIssuerUser,
  isIssuanceApp,
  isLimitedIssuanceApp,
  isCredentialAdminUser,
  hasTokenAcquisitionRoleRequiringIdentityAccess,
)

export const isAllowedToViewAsyncIssuanceRequests = or(isUserWithReadPermissions, isIssuanceApp)
