import { In } from 'typeorm'
import type { CommandContext } from '../../../cqs'
import { IdentityEntity } from '../entities/identity-entity'

export async function DeleteIdentitiesCommand(this: CommandContext, identityIds: string[]) {
  const uniqueIds = Array.from(new Set(identityIds))
  const repo = this.entityManager.getRepository(IdentityEntity)

  const identities = await repo.findBy({ id: In(uniqueIds) })

  if (identities.length !== uniqueIds.length) {
    const foundIds = identities.map((i) => i.id)
    const missing = uniqueIds.filter((id) => !foundIds.includes(id))
    throw new Error(`Could not find identities: ${missing.join(', ')}`)
  }

  try {
    await repo.remove(identities)
  } catch (err) {
    throw new Error(`Identities ${uniqueIds.join(', ')} cannot be deleted as one or more identities are currently in use.`)
  }
}
