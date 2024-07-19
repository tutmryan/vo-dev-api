import { and, rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import type { MutationCapturePhotoArgs } from '../../generated/graphql'
import { InternalRoles } from '../../roles'
import { hasRoleRule } from '../../util/shield-utils'

export const isLimitedPhotoCaptureUser = hasRoleRule(InternalRoles.limitedPhotoCapture, 'isLimitedPhotoCaptureUser')

export const isValidCapturePhoto = and(
  isLimitedPhotoCaptureUser,
  rule('isValidCapturePhotoRequestId', { cache: 'strict' })(
    (_, { photoCaptureRequestId }: MutationCapturePhotoArgs, { user }: GraphQLContext) => {
      if (!user?.limitedPhotoCaptureData?.photoCaptureRequestId) return false
      return user.limitedPhotoCaptureData.photoCaptureRequestId === photoCaptureRequestId
    },
  ),
)
