import type { CommandContext } from '../../../cqrs/command-context'
import type { UpdateIdentityInput } from '../entities/user-entity'
import { UserEntity } from '../entities/user-entity'
import { pick } from 'lodash'

export type FindUpdateOrCreateUserInput = Pick<UserEntity, 'oid' | 'tenantId' | 'name' | 'email' | 'isApp'>

/**
 * Finds an existing user by issuer and oid claims, updates mutable properties, or creates a new user.
 */
export async function FindUpdateOrCreateUser(this: CommandContext, input: FindUpdateOrCreateUserInput): Promise<UserEntity> {
  const repo = this.entityManager.getRepository(UserEntity)

  const existingUser = await repo.findOneBy({ oid: input.oid, tenantId: input.tenantId })
  if (!existingUser) {
    return await repo.save(new UserEntity(input))
  }

  const updateInput: UpdateIdentityInput = pick(input, 'email', 'name')
  const changed = existingUser.update(updateInput)
  if (changed) await repo.update(existingUser.id, updateInput)

  return existingUser
}
