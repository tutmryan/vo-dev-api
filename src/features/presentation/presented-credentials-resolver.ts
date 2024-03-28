import type { PresentedCredential } from '../../generated/graphql'
import type { User } from '../../user'
import { PRESENTATION_DATA_TTL, getPresentationDataFromCache } from './callback/cache'
import type { PresentationEntity } from './entities/presentation-entity'

/**
 * We do not persist claims data in the database,
 * so to support a polling model (vs subscription or callback) with complete data,
 * we will resolve claims data from a cache with limited lifetime.
 * @returns The complete presented credentials data, including claims, if queried within a limited time window;
 * or otherwise, the persisted credentials without claims.
 */
export const resolvePresentedCredentials = async (
  presentationEntity: PresentationEntity,
  user: User | undefined,
): Promise<PresentedCredential[]> => {
  const persistedCredentials = presentationEntity.presentedCredentials.map((c) => ({ ...c, claims: {} }))

  if (
    hasPresentedCredentialsTTLExpired(presentationEntity) ||
    !didCurrentUserRequestPresentation(presentationEntity, user) ||
    !presentationEntity.requestId
  )
    return persistedCredentials

  const cachedData = await getPresentationDataFromCache(presentationEntity.requestId)
  if (!cachedData) return persistedCredentials
  return cachedData.event.verifiedCredentialsData ?? []
}

const hasPresentedCredentialsTTLExpired = (presentationEntity: PresentationEntity) =>
  presentationEntity.presentedAt.getTime() + PRESENTATION_DATA_TTL * 1000 <= Date.now()

const didCurrentUserRequestPresentation = (presentationEntity: PresentationEntity, user: User | undefined) =>
  user && user.userEntity.id === presentationEntity.requestedById
