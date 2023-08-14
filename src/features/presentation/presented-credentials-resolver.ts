import { PRESENTED_CREDENTIALS_TTL, presentedCredentialsCache } from '../../cache'
import type { PresentedCredential } from '../../generated/graphql'
import type { User } from '../../user'
import type { PresentationEntity } from './entities/presentation-entity'

export const resolvePresentedCredentials = async (
  presentationEntity: PresentationEntity,
  user: User | undefined,
): Promise<PresentedCredential[]> => {
  const entityValue = presentationEntity.presentedCredentials.map((c) => ({ ...c, claims: {} }))
  if (
    hasPresentedCredentialsTTLExpired(presentationEntity) ||
    !didCurrentUserRequestPresentation(presentationEntity, user) ||
    !presentationEntity.requestId
  )
    return entityValue

  const presentedCredentialsDetails = await presentedCredentialsCache.get(presentationEntity.requestId)
  if (!presentedCredentialsDetails) return entityValue
  return JSON.parse(presentedCredentialsDetails) as PresentedCredential[]
}

const hasPresentedCredentialsTTLExpired = (presentationEntity: PresentationEntity) =>
  presentationEntity.presentedAt.getTime() + PRESENTED_CREDENTIALS_TTL * 1000 <= Date.now()

const didCurrentUserRequestPresentation = (presentationEntity: PresentationEntity, user: User | undefined) =>
  user && user.userEntity.id === presentationEntity.requestedById
