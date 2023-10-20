import { and, or, rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import type {
  AcquireLimitedAccessTokenInput,
  MutationAcquireLimitedAccessTokenArgs,
  MutationCreateIssuanceRequestArgs,
  MutationCreatePresentationRequestArgs,
  QueryContractArgs,
  QueryIdentityArgs,
} from '../../generated/graphql'
import { invariant } from '../../util/invariant'
import { hasAnyRoleRuleWithName, hasRoleRule } from '../../util/shield-utils'

export const limitedAccessRole = 'VerifiableCredential.LimitedAccess'

export enum LimitedAccessTokenAcquisitionRoles {
  issuance = 'VerifiableCredential.AcquireLimitedAccessToken.Issue',
  presentation = 'VerifiableCredential.AcquireLimitedAccessToken.Present',
  listContracts = 'VerifiableCredential.AcquireLimitedAccessToken.ListContracts',
  anonymousPresentations = 'VerifiableCredential.AcquireLimitedAccessToken.AnonymousPresentations',
}

export const hasTokenAcquisitionRole = hasAnyRoleRuleWithName(
  'hasLimitedAccessTokenAcquisitionRole',
  ...Object.values(LimitedAccessTokenAcquisitionRoles),
)

export const hasTokenAcquisitionRoleRequiringIdentityAccess = hasAnyRoleRuleWithName(
  'hasLimitedAccessTokenAcquisitionRoleRequiringIdentityAccess',
  LimitedAccessTokenAcquisitionRoles.issuance,
  LimitedAccessTokenAcquisitionRoles.presentation,
  LimitedAccessTokenAcquisitionRoles.listContracts,
)

// validate input to acquire limited access token
export const isValidAcquireLimitedAccessTokenRequest = rule('isValidAcquireLimitedAccessTokenRequest', { cache: 'strict' })(
  async (_, { input }: MutationAcquireLimitedAccessTokenArgs, { user }) => {
    if (!user) return false
    if (input.allowAnonymousPresentation) {
      if (!user.roles.includes(LimitedAccessTokenAcquisitionRoles.anonymousPresentations)) return false
      invariant(
        input.requestableCredentials && input.requestableCredentials.length > 0,
        'requestableCredentials are required for limited presentation access',
      )
      invariant(
        input.requestableCredentials.every(({ acceptedIssuers }) => !acceptedIssuers || acceptedIssuers.length === 0),
        'acceptedIssuers must be empty for limited anonymous presentations',
      )
      invariant(Object.keys(input).length === 2, 'allowAnonymousPresentation can only be used with requestableCredentials input')
    }
    if (input.issuableContractIds && input.issuableContractIds.length > 0) {
      if (!user.roles.includes(LimitedAccessTokenAcquisitionRoles.issuance)) return false
      invariant(input.identityId, 'identityId is required for limited issuance tokens')
    }
    if (input.requestableCredentials && input.requestableCredentials.length > 0) {
      if (!input.allowAnonymousPresentation && !user.roles.includes(LimitedAccessTokenAcquisitionRoles.presentation)) return false
      invariant(input.allowAnonymousPresentation || input.identityId, 'identityId is required for limited presentation tokens')
    }
    if (input.listContracts) {
      if (!user.roles.includes(LimitedAccessTokenAcquisitionRoles.listContracts)) return false
    }
    return true
  },
)

// limited access app variants
export const isLimitedAccessApp = hasRoleRule(limitedAccessRole, 'isLimitedAccessApp')
export const isLimitedAnonymousPresentationApp = and(
  isLimitedAccessApp,
  hasLimitedAccessDataRule('allowAnonymousPresentation', ({ allowAnonymousPresentation }) => allowAnonymousPresentation === true),
)
export const isLimitedIssuanceApp = and(
  isLimitedAccessApp,
  hasLimitedAccessDataRule('limitedIssuance', ({ issuableContractIds }) => !!issuableContractIds && issuableContractIds.length > 0),
)
export const isLimitedPresentationApp = and(
  isLimitedAccessApp,
  hasLimitedAccessDataRule(
    'limitedPresentation',
    ({ requestableCredentials }) => !!requestableCredentials && requestableCredentials.length > 0,
  ),
)
export const isLimitedListContractsApp = and(
  isLimitedAccessApp,
  hasLimitedAccessDataRule('listContracts', ({ listContracts }) => listContracts === true),
)

function hasLimitedAccessDataRule(ruleKey: string, verify: (data: AcquireLimitedAccessTokenInput) => boolean) {
  return rule(`hasLimitedAccessData-${ruleKey}`, { cache: 'contextual' })(
    (_, __, { user }: GraphQLContext) => !!user?.limitedAccessData && verify(user.limitedAccessData),
  )
}

// limited access issuance validation
export const isValidLimitedIssuanceRequest = and(
  isLimitedIssuanceApp,
  rule('isValidLimitedIssuanceRequest', { cache: 'strict' })(
    (_, { request: { contractId, identityId } }: MutationCreateIssuanceRequestArgs, { user }: GraphQLContext) => {
      if (!user?.limitedAccessData?.identityId) return false
      if (identityId && identityId !== user.limitedAccessData.identityId) return false
      if (!user.limitedAccessData.issuableContractIds) return false
      return user.limitedAccessData.issuableContractIds.includes(contractId)
    },
  ),
)

// limited access presentation validation
export const isValidLimitedPresentationRequest = and(
  isLimitedPresentationApp,
  rule('isValidLimitedPresentationRequest', { cache: 'strict' })(
    (_, { request: { requestedCredentials, identityId } }: MutationCreatePresentationRequestArgs, { user }: GraphQLContext) => {
      if (!user || !user.limitedAccessData || !user.limitedAccessData.requestableCredentials) return false
      const requestableCredentials = user.limitedAccessData.requestableCredentials

      // validate every requested credential is included in the limited access data
      const issuersMatch = requestedCredentials.every((requestedCredential) => {
        return requestableCredentials.some(({ credentialType, acceptedIssuers }) => {
          return (
            requestedCredential.type === credentialType &&
            (!requestedCredential.acceptedIssuers ||
              requestedCredential.acceptedIssuers.every((issuer) => acceptedIssuers && acceptedIssuers.includes(issuer)))
          )
        })
      })
      if (!issuersMatch) return false

      // if (external) issuers are used, we need identityId on the request to link issuance to the identity (we can't use standard claims from externally issued creds)
      const hasIssuersSpecified = requestedCredentials.some(({ acceptedIssuers }) => !!acceptedIssuers && acceptedIssuers.length > 0)
      if (hasIssuersSpecified) {
        if (!identityId) return false
        if (identityId !== user.limitedAccessData.identityId) return false
      }

      return true
    },
  ),
)

// limited contract access
export const isValidLimitedContractRequest = and(
  isLimitedAccessApp,
  rule('isValidLimitedContractRequest', { cache: 'strict' })(
    (_, args: QueryContractArgs, { user }: GraphQLContext) =>
      !!user?.limitedAccessData?.issuableContractIds && user.limitedAccessData.issuableContractIds.includes(args.id),
  ),
)

// limited identity access
export const isValidLimitedIdentityRequest = and(
  isLimitedAccessApp,
  rule('isValidLimitedIdentityRequest', { cache: 'strict' })(
    (_, args: QueryIdentityArgs, { user }: GraphQLContext) => args.id === user?.limitedAccessData?.identityId,
  ),
)

// limited identity filter
export const isValidLimitedIdentityFilter = rule('isValidLimitedIdentitierFilter', { cache: 'strict' })(
  (_, args: { where?: { identityId?: string } }, { user }: GraphQLContext) =>
    !!args.where?.identityId && !!user?.limitedAccessData?.identityId && args.where.identityId === user.limitedAccessData.identityId,
)

// criteria with requestId validation
export const requestIdFilterDefined = rule('isRequestIdFilterDefined', { cache: 'strict' })(async (_, { where }) => !!where?.requestId)

// issuance and presentation access rules
export const isValidLimitedAccessIssuanceFilter = and(isLimitedAccessApp, or(requestIdFilterDefined, isValidLimitedIdentityFilter))
export const isValidLimitedAccessPresentationFilter = and(isLimitedAccessApp, or(requestIdFilterDefined, isValidLimitedIdentityFilter))
