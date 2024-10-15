import { randomUUID } from 'crypto'
import { batchInsert, bulkFindByTuple, DEFAULT_INSERT_BATCH_SIZE } from '../../data/bulk-operations'
import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import type { IdentityInput } from '../../generated/graphql'
import { invariant } from '../../util/invariant'
import { NotFalsy } from '../../util/type-helpers'
import { AsyncIssuanceAudit } from '../async-issuance/entities/async-issuance-audit'
import type { AuditData, AuditOptimisationControl } from '../auditing/auditing-event-subscribers'
import { UserEntity } from '../users/entities/user-entity'
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
  const existingEntitiesMap = new Map(existingEntities.map((identity) => [identityInputKey(identity), identity]))

  // Updates
  const identitiesToUpdate = inputs
    .map((input) => {
      const identityKey = identityInputKey(input)
      const existing = existingEntitiesMap.get(identityKey)
      return existing && existing.name !== input.name
        ? {
            id: existing.id,
            name: input.name,
          }
        : null
    })
    .filter(NotFalsy)
  if (identitiesToUpdate.length > 0) {
    // This could be optimised. However, the easy optimisation methods require handling the audit data differently, and given the
    // probability of this being a rare operation, it's not worth the complexity.
    for (const identity of identitiesToUpdate) {
      const identityToUpdate = await repo.findOneByOrFail({ id: identity.id })
      identityToUpdate.name = identity.name
      await repo.save(identityToUpdate)
    }
  }

  // Inserts
  const identitiesToAdd = inputs.filter((input) => !existingEntitiesMap.has(identityInputKey(input))).map((i) => new IdentityEntity(i))
  if (identitiesToAdd.length > 0) {
    const auditEntriesToSave: AuditData[] = []
    await batchInsert(identitiesToAdd, repo, DEFAULT_INSERT_BATCH_SIZE, {
      handoffInsert: (auditData) => auditEntriesToSave.push(auditData),
    } satisfies AuditOptimisationControl)

    // Optimisation: The user is the same for all entries
    const auditUser = await entityManager.getRepository(UserEntity).findOneOrFail({ where: { id: auditEntriesToSave[0]!.userId } })
    const auditRecordsToSave = auditEntriesToSave.map((auditData) => ({
      id: randomUUID(),
      entityId: auditData.entityId,
      auditData: auditData.auditData,
      action: auditData.action,
      user: auditUser,
      auditDateTime: auditData.auditDateTime,
    }))
    invariant(auditRecordsToSave.length === auditEntriesToSave.length, 'Audit data was not saved correctly')
    await batchInsert(auditRecordsToSave, entityManager.getRepository(AsyncIssuanceAudit), DEFAULT_INSERT_BATCH_SIZE)
  }

  return new Map([...existingEntities, ...identitiesToAdd].map((identity) => [identityInputKey(identity), identity.id]))
}
