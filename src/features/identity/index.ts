import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import type { IdentityInput } from '../../generated/graphql'
import { IdentityEntity } from './entities/identity-entity'

export async function createOrUpdateIdentity(
  entityManager: VerifiedOrchestrationEntityManager,
  input: IdentityInput,
): Promise<IdentityEntity> {
  const repo = entityManager.getRepository(IdentityEntity)
  const identity = await repo.findOneBy({ identifier: input.identifier, issuer: input.issuer })

  if (identity) {
    // update if necessary
    if (identity.name !== input.name) {
      identity.name = input.name
      return await repo.save(identity)
    }
    return identity
  }

  return await repo.save(new IdentityEntity(input))
}
