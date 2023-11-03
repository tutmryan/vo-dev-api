import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache'
import { pick } from 'lodash'
import type { CommandContext } from '../../../cqs'
import type { UpdateIdentityInput } from '../entities/user-entity'
import { UserEntity } from '../entities/user-entity'

export type FindUpdateOrCreateUserInput = Pick<UserEntity, 'oid' | 'tenantId' | 'name' | 'email' | 'isApp'>

const userCache = new InMemoryLRUCache<UserEntity>({
  // 1 hour
  ttl: 1000 * 60 * 60,
  // 100 items, we don't expect many users to be logged in at the same time
  max: 100,
  // as per doc, unecessary
  ttlAutopurge: false,
})

/**
 * Finds an existing user by issuer and oid claims, updates mutable properties, or creates a new user.
 * Caches the user in memory for 1 hour.
 */
export async function FindUpdateOrCreateUser(this: CommandContext, input: FindUpdateOrCreateUserInput): Promise<UserEntity> {
  const repo = this.entityManager.getRepository(UserEntity)

  const cachedUser = await userCache.get(input.oid)
  const existingUser =
    cachedUser ?? (await repo.findOne({ comment: 'FindUserByOidTenant', where: { oid: input.oid, tenantId: input.tenantId } }))

  if (existingUser) {
    // save user changes, if there are any
    const updateInput: UpdateIdentityInput = pick(input, 'email', 'name')
    const changed = existingUser.update(updateInput)
    if (changed) await repo.update(existingUser.id, updateInput)
    // cache the user, if not already cached
    if (!cachedUser) await userCache.set(input.oid, existingUser)
    return existingUser
  } else {
    // create, save and cache new user
    const newUser = await repo.save(new UserEntity(input))
    await userCache.set(input.oid, newUser)
    return newUser
  }
}
