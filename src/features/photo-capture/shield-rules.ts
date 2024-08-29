import { and, or, rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import type { MutationCapturePhotoArgs, MutationCreatePhotoCaptureRequestArgs } from '../../generated/graphql'
import { InternalRoles } from '../../roles'
import { hasRoleRule } from '../../util/shield-utils'
import { isLimitedIssuanceApp } from '../limited-access-tokens'
import { isLimitedAsyncIssuancePhotoCaptureUser } from '../limited-async-issuance-tokens/shield-rules'

export const isLimitedPhotoCaptureUser = hasRoleRule(InternalRoles.limitedPhotoCapture, 'isLimitedPhotoCaptureUser')

export const isValidCapturePhoto = and(
  or(isLimitedPhotoCaptureUser, isLimitedAsyncIssuancePhotoCaptureUser),
  rule('isValidCapturePhotoRequestId', { cache: 'strict' })(
    (_, { photoCaptureRequestId }: MutationCapturePhotoArgs, { user }: GraphQLContext) => {
      if (!user?.limitedPhotoCaptureData?.photoCaptureRequestId) return false
      return user.limitedPhotoCaptureData.photoCaptureRequestId === photoCaptureRequestId
    },
  ),
)

export const isValidLimitedIssuancePhotoCaptureRequest = and(
  isLimitedIssuanceApp,
  rule('isValidLimitedIssuancePhotoCaptureRequest', { cache: 'strict' })(
    (_, args: MutationCreatePhotoCaptureRequestArgs | null | undefined, { user }: GraphQLContext) => {
      if (!args?.request) return false
      const {
        request: { contractId, identityId },
      } = args
      if (!user?.limitedAccessData?.identityId) return false
      if (identityId && identityId !== user.limitedAccessData.identityId) return false
      if (!user.limitedAccessData.issuableContractIds) return false
      return contractId && user.limitedAccessData.issuableContractIds.includes(contractId)
    },
  ),
)
