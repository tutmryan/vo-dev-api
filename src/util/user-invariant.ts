import type { GraphQLContext } from '../context'
import { IdentityEntity } from '../features/identity/entities/identity-entity'
import { UserEntity } from '../features/users/entities/user-entity'
import type { User } from '../user'
import { invariant } from './invariant'

export function userInvariant(user?: GraphQLContext['user']): asserts user is User<UserEntity> {
  invariant(user, 'User is required')
  invariant(user.entity instanceof UserEntity, 'User<UserEntity> is required')
}

export function userIdentityInvariant(user?: GraphQLContext['user']): asserts user is User<IdentityEntity> {
  invariant(user, 'User is required')
  invariant(user.entity instanceof IdentityEntity, 'User<IdentityEntity> is required')
}

export function anyUserInvariant(user?: GraphQLContext['user']): asserts user {
  invariant(user, 'User is required')
}

export function userIsUserEntity(user?: GraphQLContext['user']): user is User<UserEntity> {
  return user?.entity instanceof UserEntity
}

export function userIsIdentityEntity(user?: GraphQLContext['user']): user is User<IdentityEntity> {
  return user?.entity instanceof IdentityEntity
}
