import { bulkFindByTuple, bulkInsert } from '../../data/bulk-operations'
import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import type { IdentityInput } from '../../generated/graphql'
import { IdentityAudit } from './entities/identity-audit'
import { IdentityEntity } from './entities/identity-entity'

export const identityInputKey = ({ issuer, identifier }: IdentityInput) => issuer + identifier

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

export async function bulkCreateOrUpdateIdentity(
  entityManager: VerifiedOrchestrationEntityManager,
  inputs: IdentityInput[],
): Promise<Map<string, string>> {
  const repo = entityManager.getRepository(IdentityEntity)

  const existingEntities = await bulkFindByTuple(
    repo,
    ['identifier', 'issuer'],
    inputs.map(({ identifier, issuer }) => [identifier, issuer]),
  )
  const existingEntitiesMap: Map<string, IdentityEntity> = new Map(
    existingEntities.map((identity) => [identityInputKey(identity), identity]),
  )

  // Updates
  for (const input of inputs) {
    const existing = existingEntitiesMap.get(identityInputKey(input))
    if (existing && existing.name !== input.name) {
      existing.name = input.name
      // This could be optimised. However, the easy optimisation methods, such as update, don't audit data correctly, and given the
      // probability of this being a rare operation, it's not worth the complexity.
      await repo.save(existing)
    }
  }

  // Inserts
  const identitiesToAdd = inputs.filter((input) => !existingEntitiesMap.has(identityInputKey(input))).map((i) => new IdentityEntity(i))
  await bulkInsert(identitiesToAdd, IdentityEntity, entityManager, {
    entityAuditTarget: IdentityAudit,
  })

  return new Map([...existingEntities, ...identitiesToAdd].map((identity) => [identityInputKey(identity), identity.id]))
}
