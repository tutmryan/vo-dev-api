import type { User } from '../../user'
import { PRESENTATION_DATA_TTL } from './callback/cache'
import type { PresentationEntity } from './entities/presentation-entity'
import { resolvePresentedCredentials } from './presented-credentials-resolver'

const mockPresentationCacheGet = jest.fn()
jest.mock('./callback/cache', () => {
  const originalModule = jest.requireActual('./callback/cache')
  return {
    ...originalModule,
    getPresentationDataFromCache: (args: any) => mockPresentationCacheGet(args),
  }
})

describe('presentedCredentialsResolver', () => {
  const currentUserId = 'user-1'
  it('does not load from cache if TTL has expired', () => {
    // Arrange
    const presentedAt = new Date(Date.now() - (PRESENTATION_DATA_TTL + 10) * 1000)
    const entity = givenAPresentationEntity({ presentedAt: presentedAt, requestedById: currentUserId })
    const currentUser = givenAUser(currentUserId)

    // Act
    resolvePresentedCredentials(entity, currentUser)

    // Assert
    expect(mockPresentationCacheGet).not.toHaveBeenCalled()
  })

  it('does not load from cache if TTL has just reached', () => {
    // Arrange
    const presentedAt = new Date(Date.now() - PRESENTATION_DATA_TTL * 1000)
    const entity = givenAPresentationEntity({ presentedAt: presentedAt, requestedById: currentUserId })
    const currentUser = givenAUser(currentUserId)

    // Act
    resolvePresentedCredentials(entity, currentUser)

    // Assert
    expect(mockPresentationCacheGet).not.toHaveBeenCalled()
  })

  it('does not load from cache if current user did not make the presentation request', () => {
    // Arrange
    const presentedAt = new Date(Date.now() - (PRESENTATION_DATA_TTL - 10) * 1000)
    const entity = givenAPresentationEntity({ presentedAt: presentedAt, requestedById: 'user-2' })
    const currentUser = givenAUser(currentUserId)

    // Act
    resolvePresentedCredentials(entity, currentUser)

    // Assert
    expect(mockPresentationCacheGet).not.toHaveBeenCalled()
  })

  it('load from cache if TTL has not yet expired', () => {
    // Arrange
    const presentedAt = new Date(Date.now() - (PRESENTATION_DATA_TTL - 10) * 1000)
    const entity = givenAPresentationEntity({ presentedAt: presentedAt, requestedById: currentUserId })
    const currentUser = givenAUser(currentUserId)

    // Act
    resolvePresentedCredentials(entity, currentUser)

    // Assert
    expect(mockPresentationCacheGet).toHaveBeenCalled()
  })
})

const givenAPresentationEntity = (args: Partial<PresentationEntity>) => {
  return {
    requestId: 'request-1',
    identityId: 'identity-1',
    requestedById: 'user-1',
    ...args,
    issuanceIds: args.issuanceIds || ['issuance-1', 'issuance-2'],
    requestedCredentials: args.requestedCredentials || [],
    presentedCredentials: args.presentedCredentials || [],
  } as PresentationEntity
}

const givenAUser = (userId: string): User => ({ userEntity: { id: userId } } as User)
