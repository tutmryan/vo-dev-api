import type { GraphQLContext } from '../../../context'
import type { MutationProcessMDocPresentationResponseArgs } from '../../../generated/graphql'
import { mdocRequestDetailsCache } from '../../presentation/mdoc/shared-config'
import { validateLimitedProcessMDocForPresentationFlow } from '../shield-rules'

jest.mock('../../presentation/mdoc/shared-config')

const mdocRequestDetailsCacheMock = mdocRequestDetailsCache as jest.MockedFunction<typeof mdocRequestDetailsCache>

function buildArgs(requestId = 'req-1'): MutationProcessMDocPresentationResponseArgs {
  return { response: { requestId, response: 'ignored' } }
}

function buildUser(overrides: Partial<NonNullable<GraphQLContext['user']>> = {}): GraphQLContext['user'] {
  return {
    entity: { id: 'user-id' },
    limitedPresentationFlowData: { presentationFlowId: 'flow-id-1', userId: 'user-id' },
    ...overrides,
  } as GraphQLContext['user']
}

describe('validateLimitedProcessMDocForPresentationFlow', () => {
  const cacheGet = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    mdocRequestDetailsCacheMock.mockReturnValue({ get: cacheGet } as never)
  })

  it('returns false when the user has no limited presentation flow data', async () => {
    const result = await validateLimitedProcessMDocForPresentationFlow(buildArgs(), buildUser({ limitedPresentationFlowData: undefined }))
    expect(result).toBe(false)
    expect(cacheGet).not.toHaveBeenCalled()
  })

  it('returns false when the mdoc request is not in the cache', async () => {
    cacheGet.mockResolvedValue(undefined)
    const result = await validateLimitedProcessMDocForPresentationFlow(buildArgs(), buildUser())
    expect(result).toBe(false)
  })

  it('returns false when the mdoc request belongs to a different presentation flow', async () => {
    cacheGet.mockResolvedValue({ requestedById: 'user-id', presentationFlowId: 'flow-id-2' })
    const result = await validateLimitedProcessMDocForPresentationFlow(buildArgs(), buildUser())
    expect(result).toBe(false)
  })

  it('returns false when the mdoc request was created by a different user', async () => {
    cacheGet.mockResolvedValue({ requestedById: 'other-user', presentationFlowId: 'flow-id-1' })
    const result = await validateLimitedProcessMDocForPresentationFlow(buildArgs(), buildUser())
    expect(result).toBe(false)
  })

  it('returns false when the cached request has no linked presentation flow', async () => {
    cacheGet.mockResolvedValue({ requestedById: 'user-id', presentationFlowId: undefined })
    const result = await validateLimitedProcessMDocForPresentationFlow(buildArgs(), buildUser())
    expect(result).toBe(false)
  })

  it('returns true when the cached request matches the token flow and user', async () => {
    cacheGet.mockResolvedValue({ requestedById: 'user-id', presentationFlowId: 'flow-id-1' })
    const result = await validateLimitedProcessMDocForPresentationFlow(buildArgs(), buildUser())
    expect(result).toBe(true)
    expect(cacheGet).toHaveBeenCalledWith('req-1')
  })
})
