import type { JwtPayload } from '@makerx/graphql-core'
import { User as BaseUser } from '@makerx/graphql-core'
import type { UserEntity } from './features/users/entities/user-entity'

/**
 * Extends the standard user claims wrapper class.
 * Adds a reference to the created/found user entity.
 */
export class User extends BaseUser {
  userEntity: UserEntity

  constructor(claims: JwtPayload, token: string, userEntity: UserEntity) {
    super(claims, token)
    this.userEntity = userEntity
  }
}
