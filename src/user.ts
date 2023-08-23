import type { JwtPayload } from '@makerx/graphql-core'
import { User as BaseUser } from '@makerx/graphql-core'
import type { UserEntity } from './features/users/entities/user-entity'
import type { AcquireLimitedAccessTokenInput } from './generated/graphql'

/**
 * Extends the standard user claims wrapper class.
 * Adds a reference to the created/found user entity.
 */
export class User extends BaseUser {
  userEntity: UserEntity
  limitedAccessData?: AcquireLimitedAccessTokenInput

  constructor(claims: JwtPayload, token: string, userEntity: UserEntity, limitedAccessData?: AcquireLimitedAccessTokenInput) {
    super(claims, token)
    this.userEntity = userEntity
    this.limitedAccessData = limitedAccessData
  }
}
