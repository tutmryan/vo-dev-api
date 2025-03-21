import { beforeAfterAll } from '../../test'
import { mockedServices } from '../../test/mocks'
import { keys, oidcKeyHoursBeforeUsage } from './keys'
import { subHours } from 'date-fns'

describe('keys', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  it('returns a single key', async () => {
    // Arrange
    const mockKey = { jwk: { kty: 'RSA' }, createdOn: new Date() }
    mockedServices.oidcStorageService.loadExistingKeys.mock().mockResolvedValue([mockKey])

    // Act
    const result = await keys()

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(mockKey.jwk)
  })
  it('returns multiple keys in correct order', async () => {
    // Arrange
    const mockKeys = [
      { jwk: { kty: 'RSA' }, createdOn: subHours(new Date(), oidcKeyHoursBeforeUsage + 1) },
      { jwk: { kty: 'RSA' }, createdOn: subHours(new Date(), oidcKeyHoursBeforeUsage * 2 + 1) },
    ]
    mockedServices.oidcStorageService.loadExistingKeys.mock().mockResolvedValue(mockKeys)

    // Act
    const result = await keys()

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(mockKeys[0]!.jwk)
    expect(result[1]).toEqual(mockKeys[1]!.jwk)
  })
  it('returns with the newest key at the back if newer than the cutoff', async () => {
    // Arrange
    const recentKey = { jwk: { kty: 'RSA' }, createdOn: new Date() }
    const olderKey = { jwk: { kty: 'RSA' }, createdOn: subHours(new Date(), oidcKeyHoursBeforeUsage + 1) }
    mockedServices.oidcStorageService.loadExistingKeys.mock().mockResolvedValue([recentKey, olderKey])

    // Act
    const result = await keys()

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(olderKey.jwk)
    expect(result[1]).toEqual(recentKey.jwk)
  })
})
