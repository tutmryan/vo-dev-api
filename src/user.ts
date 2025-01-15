import type { JwtPayload } from '@makerx/graphql-core'
import { User as BaseUser } from '@makerx/graphql-core'
import type { AsyncIssuanceSessionData } from './features/async-issuance/session'
import type { IdentityEntity } from './features/identity/entities/identity-entity'
import type { LimitedApprovalData } from './features/limited-approval-tokens'
import type { PhotoCaptureData } from './features/photo-capture'
import type { UserEntity } from './features/users/entities/user-entity'
import type { AcquireLimitedAccessTokenInput } from './generated/graphql'

/**
 * Extends the standard user claims wrapper class.
 * Adds a reference to the created/found user or identity entity.
 */
export class User<TEntity extends UserEntity | IdentityEntity> extends BaseUser {
  entity: TEntity
  limitedAccessData?: AcquireLimitedAccessTokenInput
  limitedApprovalData?: LimitedApprovalData
  limitedPhotoCaptureData?: PhotoCaptureData
  limitedAsyncIssuanceData?: AsyncIssuanceSessionData

  constructor(
    claims: JwtPayload,
    token: string,

    entity: TEntity,
    limitedAccessData?: AcquireLimitedAccessTokenInput,
    limitedApprovalData?: LimitedApprovalData,
    limitedPhotoCaptureData?: PhotoCaptureData,
    limitedAsyncIssuanceData?: AsyncIssuanceSessionData,
  ) {
    super(claims, token)

    this.entity = entity
    this.limitedAccessData = limitedAccessData
    this.limitedApprovalData = limitedApprovalData
    this.limitedPhotoCaptureData = limitedPhotoCaptureData
    this.limitedAsyncIssuanceData = limitedAsyncIssuanceData
  }

  get scopes() {
    return ((this.claims.scope as string | undefined) ?? this.claims.scp ?? '').split(' ')
  }
}
