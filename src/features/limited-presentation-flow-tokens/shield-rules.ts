import { and, rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import type {
  MutationCancelPresentationFlowArgs,
  MutationCreatePresentationRequestForPresentationFlowArgs,
  MutationSubmitPresentationFlowActionsArgs,
  QueryPresentationFlowArgs,
} from '../../generated/graphql'
import { InternalRoles } from '../../roles'
import { hasRoleRule } from '../../util/shield-utils'
import { requestIdFilterDefined } from '../limited-access-tokens/shield-rules'

export const isLimitedPresentationFlowApp = hasRoleRule(InternalRoles.limitedPresentationFlow, 'isLimitedPresentationFlowApp')

export const isValidLimitedPresentationFlowPresentationFilter = and(isLimitedPresentationFlowApp, requestIdFilterDefined)

export const isValidLimitedPresentationFlow = and(
  isLimitedPresentationFlowApp,
  rule('isValidLimitedPresentationFlow', { cache: 'strict' })(
    (_, { id }: QueryPresentationFlowArgs, { user }: GraphQLContext) =>
      !!user?.limitedPresentationFlowData?.presentationFlowId && user.limitedPresentationFlowData.presentationFlowId === id,
  ),
)

export const isValidLimitedCreatePresentationRequestForPresentationFlow = and(
  isLimitedPresentationFlowApp,
  rule('isValidLimitedCreatePresentationRequestForPresentationFlow', { cache: 'strict' })(
    (_, { presentationFlowId }: MutationCreatePresentationRequestForPresentationFlowArgs, { user }: GraphQLContext) =>
      !!user?.limitedPresentationFlowData?.presentationFlowId && user.limitedPresentationFlowData.presentationFlowId === presentationFlowId,
  ),
)

export const hasPresentationFlowPresentationAndMatchesId = rule('hasPresentationFlowPresentationAndMatchesId', {
  cache: 'strict',
})(
  (_, args: QueryPresentationFlowArgs | MutationSubmitPresentationFlowActionsArgs, { user }: GraphQLContext) =>
    !!user?.limitedPresentationFlowData?.presentationId && user.limitedPresentationFlowData.presentationFlowId === (args as any).id,
)

export const isValidLimitedCancelPresentationFlow = and(
  isLimitedPresentationFlowApp,
  rule('isValidLimitedCancelPresentationFlow', { cache: 'strict' })(
    (_, { id }: MutationCancelPresentationFlowArgs, { user }: GraphQLContext) =>
      !!user?.limitedPresentationFlowData?.presentationFlowId && user.limitedPresentationFlowData.presentationFlowId === id,
  ),
)
