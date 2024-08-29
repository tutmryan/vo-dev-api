import { and, rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import type { MutationCreateIssuanceRequestForAsyncIssuanceArgs } from '../../generated/graphql'
import { InternalRoles } from '../../roles'
import { hasRoleRule } from '../../util/shield-utils'
import { requestIdFilterDefined } from '../limited-access-tokens'

export const isLimitedAsyncIssuanceApp = hasRoleRule(InternalRoles.limitedAsyncIssuance, 'isLimitedAsyncIssuanceApp')

export const isLimitedAsyncIssuancePhotoCaptureUser = and(
  isLimitedAsyncIssuanceApp,
  rule('asyncIssuanceRequiresPhotoCapture', { cache: 'contextual' })((_, __, { user }: GraphQLContext) => {
    return user?.limitedAsyncIssuanceData?.photoCapture === true
  }),
)

export const isValidCreateIssuanceRequestForAsyncIssuanceRequest = and(
  isLimitedAsyncIssuanceApp,
  rule('hasCorrectCreateIssuanceRequestForAsyncIssuanceArgs', { cache: 'strict' })(
    (_, args: MutationCreateIssuanceRequestForAsyncIssuanceArgs | null | undefined, { user }: GraphQLContext) => {
      if (!args?.asyncIssuanceRequestId) return false
      if (!user?.limitedAsyncIssuanceData?.asyncIssuanceRequestId) return false
      return user.limitedAsyncIssuanceData.asyncIssuanceRequestId === args.asyncIssuanceRequestId
    },
  ),
)

export const isValidLimitedAsyncIssuanceIssuanceFilter = and(isLimitedAsyncIssuanceApp, requestIdFilterDefined)
