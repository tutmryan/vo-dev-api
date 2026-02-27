import { and, rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import type {
  MutationCancelPresentationFlowArgs,
  MutationCreatePresentationRequestForPresentationFlowArgs,
  QueryPresentationFlowArgs,
} from '../../generated/graphql'
import { AppRoles, InternalRoles, UserRoles } from '../../roles'
import { hasAnyRoleRuleWithName, hasRoleRule } from '../../util/shield-utils'

export const isLimitedPresentationFlowApp = hasRoleRule(InternalRoles.limitedPresentationFlow, 'isLimitedPresentationFlowApp')

export const canCreatePresentationFlow = hasAnyRoleRuleWithName(
  'canCreatePresentationFlow',
  UserRoles.presentationFlowCreate,
  AppRoles.presentationFlowCreate,
)

export const canReadPresentationFlow = hasAnyRoleRuleWithName(
  'canReadPresentationFlow',
  UserRoles.presentationFlowRead,
  AppRoles.presentationFlowRead,
)

export const canCancelPresentationFlow = hasAnyRoleRuleWithName(
  'canCancelPresentationFlow',
  UserRoles.presentationFlowCancel,
  AppRoles.presentationFlowCancel,
)

export const canCreatePresentationFlowTemplate = hasAnyRoleRuleWithName(
  'canCreatePresentationFlowTemplate',
  UserRoles.presentationFlowCreateTemplate,
  AppRoles.presentationFlowCreateTemplate,
)

export const canReadPresentationFlowTemplate = hasAnyRoleRuleWithName(
  'canReadPresentationFlowTemplate',
  UserRoles.presentationFlowReadTemplate,
  AppRoles.presentationFlowReadTemplate,
)

export const canUpdatePresentationFlowTemplate = hasAnyRoleRuleWithName(
  'canUpdatePresentationFlowTemplate',
  UserRoles.presentationFlowUpdateTemplate,
  AppRoles.presentationFlowUpdateTemplate,
)

export const canDeletePresentationFlowTemplate = hasAnyRoleRuleWithName(
  'canDeletePresentationFlowTemplate',
  UserRoles.presentationFlowDeleteTemplate,
  AppRoles.presentationFlowDeleteTemplate,
)

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

export const isValidLimitedCancelPresentationFlow = and(
  isLimitedPresentationFlowApp,
  rule('isValidLimitedCancelPresentationFlow', { cache: 'strict' })(
    (_, { id }: MutationCancelPresentationFlowArgs, { user }: GraphQLContext) =>
      !!user?.limitedPresentationFlowData?.presentationFlowId && user.limitedPresentationFlowData.presentationFlowId === id,
  ),
)
