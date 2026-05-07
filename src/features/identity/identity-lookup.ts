import { createHmac } from 'crypto'

import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import { IdentityStoreType, OidcIdentityLookupType } from '../../generated/graphql'
import { graphServiceManager } from '../../services'
import { type GraphService } from '../../services/graph-service'
import { invariant } from '../../util/invariant'
import { IdentityStoreEntity } from '../identity-store/entities/identity-store-entity'
import { IdentityEntity } from './entities/identity-entity'

const canonicaliseEmail = (email: string): string => email.trim().toLowerCase()

const computeLookupValue = (identityStoreId: string, email: string): string => {
  const canonical = canonicaliseEmail(email)
  return createHmac('sha256', identityStoreId).update(canonical).digest('hex')
}

const getConfiguredGraphService = async (identityStoreId: string) => {
  const graphService = await graphServiceManager.get(identityStoreId)

  invariant(graphService && graphService.isConfigured, 'Graph service is not configured for the specified identity store.')

  return graphService
}

const findOrCreateIdentityWithGraph = async (
  identityRepo: any,
  identityStore: IdentityStoreEntity,
  identityStoreId: string,
  findExisting: () => Promise<IdentityEntity | null>,
  fetchUser: (graphService: GraphService) => Promise<{ user: any; lookupValue: string | null } | undefined>,
): Promise<IdentityEntity | undefined> => {
  const existing = await findExisting()
  if (existing) return existing

  const graphService = await getConfiguredGraphService(identityStoreId)
  const result = await fetchUser(graphService)
  if (!result) return undefined

  const { user, lookupValue } = result
  if (!user?.id) return undefined

  const name =
    user.displayName ||
    [user.givenName, user.surname].filter((p: string | undefined): p is string => !!p && p.length > 0).join(' ') ||
    user.id

  // Upsert by issuer + identifier: if identity already exists, update lookupValue if needed
  const existingByIdentifier = await identityRepo.findOne({
    where: { issuer: identityStore.identifier, identifier: user.id },
  })

  if (existingByIdentifier) {
    if (lookupValue && existingByIdentifier.lookupValue !== lookupValue) {
      existingByIdentifier.lookupValue = lookupValue
      return await identityRepo.save(existingByIdentifier)
    }

    return existingByIdentifier
  }

  const identity = new IdentityEntity({
    identityStoreId,
    issuer: identityStore.identifier,
    identifier: user.id,
    name,
  })
  identity.lookupValue = lookupValue

  return await identityRepo.save(identity)
}

export async function findOrCreateIdentityFromEntra(
  entityManager: VerifiedOrchestrationEntityManager,
  identityStoreId: string,
  lookupType: OidcIdentityLookupType,
  claimValue: string,
): Promise<IdentityEntity | undefined> {
  const identityStoreRepo = entityManager.getRepository(IdentityStoreEntity)
  const identityStore = await identityStoreRepo.findOneByOrFail({ id: identityStoreId })

  invariant(identityStore.type === IdentityStoreType.Entra, 'Only Entra identity stores are supported for external identity lookups.')

  const identityRepo = entityManager.getRepository(IdentityEntity)

  if (lookupType === OidcIdentityLookupType.ObjectId) {
    return await findOrCreateIdentityWithGraph(
      identityRepo,
      identityStore,
      identityStoreId,
      () => identityRepo.findOne({ where: { identityStoreId, identifier: claimValue } }),
      async (graphService) => {
        const user = await graphService.getUserById(claimValue)

        if (!user?.id) return undefined

        return { user, lookupValue: null }
      },
    )
  } else {
    const lookupValue = canonicaliseEmail(claimValue)
    const namespacedLookupValue = computeLookupValue(identityStoreId, `${lookupType}:${lookupValue}`)

    return await findOrCreateIdentityWithGraph(
      identityRepo,
      identityStore,
      identityStoreId,
      () => identityRepo.findOne({ where: { identityStoreId, lookupValue: namespacedLookupValue } }),
      async (graphService) => {
        const user = await (lookupType === OidcIdentityLookupType.UserPrincipalName
          ? graphService.getUserByUserPrincipalName(lookupValue)
          : graphService.getUserByEmail(lookupValue))

        if (!user?.id) return undefined

        return { user, lookupValue }
      },
    )
  }
}
