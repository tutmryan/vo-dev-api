import { and, rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import type {
  MutationActionApprovalRequestArgs,
  MutationCreatePresentationRequestForApprovalArgs,
  QueryApprovalRequestArgs,
} from '../../generated/graphql'
import { AppRoles, InternalRoles } from '../../roles'
import { hasRoleRule } from '../../util/shield-utils'
import { requestIdFilterDefined } from '../limited-access-tokens/shield-rules'

export const isApprovalRequestApp = hasRoleRule(AppRoles.requestApproval, 'isApprovalRequestApp')
export const isLimitedApprovalApp = hasRoleRule(InternalRoles.limitedApproval, 'isLimitedApprovalApp')
export const hasApprovalRequestPresentationAndMatchesApprovalRequestId = rule('hasApprovalRequestPresentationAndMatchesApprovalRequestId', {
  cache: 'strict',
})(
  (_, args: QueryApprovalRequestArgs | MutationActionApprovalRequestArgs, { user }: GraphQLContext) =>
    !!user?.limitedApprovalData?.presentationId && user.limitedApprovalData.approvalRequestId === args.id,
)

// limited approval presentation validation
export const isValidLimitedPresentationRequestForApproval = and(
  isLimitedApprovalApp,
  rule('isValidLimitedPresentationRequestForApproval', { cache: 'strict' })(
    (_, { approvalRequestId }: MutationCreatePresentationRequestForApprovalArgs, { user }: GraphQLContext) => {
      if (!user?.limitedApprovalData?.approvalRequestId) return false
      return user.limitedApprovalData.approvalRequestId === approvalRequestId
    },
  ),
)

export const isValidLimitedApprovalPresentationFilter = and(isLimitedApprovalApp, requestIdFilterDefined)
