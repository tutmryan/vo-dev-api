import { rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import type { QueryApprovalRequestArgs } from '../../generated/graphql'
import { AppRoles, InternalRoles } from '../../roles'
import { hasRoleRule } from '../../util/shield-utils'

export const isApprovalRequestApp = hasRoleRule(AppRoles.requestApproval, 'isApprovalRequestApp')
export const isLimitedApprovalApp = hasRoleRule(InternalRoles.limitedApproval, 'isLimitedApprovalApp')
export const hasApprovalRequestPresentationAndMatchesApprovalRequestId = rule('hasApprovalRequestPresentationAndMatchesApprovalRequestId', {
  cache: 'strict',
})(
  (_, args: QueryApprovalRequestArgs, { user }: GraphQLContext) =>
    !!user?.limitedApprovalData?.presentationId && user.limitedApprovalData.approvalRequestId.toLowerCase() === args.id.toLowerCase(),
)
