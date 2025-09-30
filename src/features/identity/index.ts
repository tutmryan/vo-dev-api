import { validate as isUuid } from 'uuid'
import { bulkFindByTuple, bulkInsert } from '../../data/bulk-operations'
import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import type { IdentityInput } from '../../generated/graphql'
import { IdentityStoreType } from '../../generated/graphql'
import { IdentityStoreEntity } from '../identity-store/entities/identity-store-entity'
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
    if (identity.name !== input.name) {
      identity.name = input.name
      return await repo.save(identity)
    }
    return identity
  }

  const store = await getOrCreateIdentityStore(entityManager, input.issuer)
  const newIdentity = new IdentityEntity({ ...input, identityStoreId: store.id })
  return await repo.save(newIdentity)
}

function classifyIssuer(issuer: string): IdentityStoreType {
  if (issuer === 'manual') return IdentityStoreType.Manual
  if (isUuid(issuer)) return IdentityStoreType.Entra
  const lower = issuer.toLowerCase()
  if (lower.includes('login.microsoftonline.com') || lower.includes('b2clogin.com')) {
    return IdentityStoreType.Entra
  }
  return IdentityStoreType.Manual
}

export async function getOrCreateIdentityStore(
  entityManager: VerifiedOrchestrationEntityManager,
  issuer: string,
): Promise<IdentityStoreEntity> {
  const repo = entityManager.getRepository(IdentityStoreEntity)

  const existing = await repo.findOne({ where: { identifier: issuer } })
  if (existing) return existing

  const type = classifyIssuer(issuer)

  const store = new IdentityStoreEntity({
    identifier: issuer,
    name: issuer === 'manual' ? 'Manually Issued' : `Identity Store (${issuer})`,
    type,
    isAuthenticationEnabled: false,
    clientId: undefined,
  })

  return await repo.save(store)
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

  // Inserts (ensure identity_store_id)
  const inserts = inputs.filter((input) => !existingEntitiesMap.has(identityInputKey(input)))
  let identitiesToAdd: IdentityEntity[] = []
  if (inserts.length) {
    const uniqueIssuers = Array.from(new Set(inserts.map((i) => i.issuer)))
    const issuerStoreMap = new Map<string, string>()
    for (const issuer of uniqueIssuers) {
      const store = await getOrCreateIdentityStore(entityManager, issuer)
      issuerStoreMap.set(issuer, store.id)
    }
    identitiesToAdd = inserts.map(
      (i) =>
        new IdentityEntity({
          ...i,
          identityStoreId: issuerStoreMap.get(i.issuer)!,
        }),
    )

    await bulkInsert(identitiesToAdd, IdentityEntity, entityManager, {
      entityAuditTarget: IdentityAudit,
    })
  }

  return new Map([...existingEntities, ...identitiesToAdd].map((identity) => [identityInputKey(identity), identity.id]))
}
