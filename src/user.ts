import type { JwtPayload } from '@makerx/graphql-core'
import { User as BaseUser } from '@makerx/graphql-core'
import type { LimitedApprovalData } from './features/limited-approval-tokens'
import type { LimitedAsyncIssuanceData } from './features/limited-async-issuance-tokens'
import type { PhotoCaptureData } from './features/photo-capture'
import type { UserEntity } from './features/users/entities/user-entity'
import type { AcquireLimitedAccessTokenInput } from './generated/graphql'

/**
 * Extends the standard user claims wrapper class.
 * Adds a reference to the created/found user entity.
 */
export class User extends BaseUser {
  userEntity: UserEntity
  limitedAccessData?: AcquireLimitedAccessTokenInput
  limitedApprovalData?: LimitedApprovalData
  limitedPhotoCaptureData?: PhotoCaptureData
  limitedAsyncIssuanceData?: LimitedAsyncIssuanceData

  constructor(
    claims: JwtPayload,
    token: string,

    userEntity: UserEntity,
    limitedAccessData?: AcquireLimitedAccessTokenInput,
    limitedApprovalData?: LimitedApprovalData,
    limitedPhotoCaptureData?: PhotoCaptureData,
    limitedAsyncIssuanceData?: LimitedAsyncIssuanceData,
  ) {
    super(claims, token)

    this.userEntity = userEntity
    this.limitedAccessData = limitedAccessData
    this.limitedApprovalData = limitedApprovalData
    this.limitedPhotoCaptureData = limitedPhotoCaptureData
    this.limitedAsyncIssuanceData = limitedAsyncIssuanceData
  }
}
