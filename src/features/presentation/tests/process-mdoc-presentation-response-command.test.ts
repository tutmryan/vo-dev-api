import type { CommandContext } from '../../../cqs'
import type { VerifiedOrchestrationEntityManager } from '../../../data/entity-manager'
import { DataType } from '../../../generated/graphql'
import type { LoggerWithMetaControl } from '../../../logger'
import { userInvariant } from '../../../util/user-invariant'
import { createOrUpdateIdentity } from '../../identity'
import { PresentationFlowEntity } from '../../presentation-flow/entities/presentation-flow-entity'
import { publishPresentationFlowEvent } from '../../presentation-flow/pubsub'
import { ProcessMDocPresentationResponseCommand } from '../commands/process-mdoc-presentation-response-command'
import { PresentationEntity } from '../entities/presentation-entity'
import { decodeAndValidateISO18013_7Response } from '../mdoc/protocols/orgIsoMdoc'
import { mdocRequestDetailsCache } from '../mdoc/shared-config'
import type { MDocRequestDetails } from '../mdoc/types'

jest.mock('../../../util/user-invariant')
jest.mock('../mdoc/protocols/orgIsoMdoc')
jest.mock('../mdoc/shared-config')
jest.mock('../../presentation-flow/pubsub')
jest.mock('../../identity')

const userInvariantMock = userInvariant as jest.MockedFunction<typeof userInvariant>
const decodeAndValidateMock = decodeAndValidateISO18013_7Response as jest.MockedFunction<typeof decodeAndValidateISO18013_7Response>
const mdocRequestDetailsCacheMock = mdocRequestDetailsCache as jest.MockedFunction<typeof mdocRequestDetailsCache>
const publishPresentationFlowEventMock = publishPresentationFlowEvent as jest.MockedFunction<typeof publishPresentationFlowEvent>
const createOrUpdateIdentityMock = createOrUpdateIdentity as jest.MockedFunction<typeof createOrUpdateIdentity>

function buildMockCacheResult(overrides: Partial<MDocRequestDetails> = {}) {
  return {
    requestId: 'req-1',
    requestedById: 'user-id',
    identityId: null,
    presentationFlowId: null,
    docType: 'org.iso.18013.5.1.mDL',
    requestedClaims: [{ path: ['org.iso.18013.5.1', 'family_name'] }, { path: ['org.iso.18013.5.1', 'given_name'] }],
    ...overrides,
  }
}

function buildMockDecodedResponse(claims: { namespace: string; elementIdentifier: string; elementValue: unknown }[]) {
  const nameSpaces: Record<string, { issuerSignedItem: { elementIdentifier: string; elementValue: unknown } }[]> = {}
  for (const claim of claims) {
    if (!nameSpaces[claim.namespace]) nameSpaces[claim.namespace] = []
    nameSpaces[claim.namespace]!.push({
      issuerSignedItem: { elementIdentifier: claim.elementIdentifier, elementValue: claim.elementValue },
    })
  }
  return {
    mDocDeviceResponse: {
      status: 0,
      documents: [
        {
          docType: 'org.iso.18013.5.1.mDL',
          issuerSigned: { nameSpaces },
        },
      ],
    },
    diagnostics: {},
  }
}

function createContext(flowEntity?: PresentationFlowEntity | null, userOverride?: CommandContext['user']): CommandContext {
  const savedPresentation = { id: 'pres-id-1' }
  const savedFlow = { ...(flowEntity ?? {}) }

  const presentationRepo = {
    save: jest.fn().mockResolvedValue(savedPresentation),
  }
  const flowRepo = {
    findOneByOrFail: jest.fn().mockResolvedValue(savedFlow),
    save: jest.fn().mockResolvedValue(undefined),
  }

  const entityManager = {
    getRepository: jest.fn().mockImplementation((entity: unknown) => {
      if (entity === PresentationEntity) return presentationRepo
      if (entity === PresentationFlowEntity) return flowRepo
      return {}
    }),
  } as unknown as VerifiedOrchestrationEntityManager

  return {
    user: userOverride ?? ({ token: 'tok', entity: { id: 'user-id' } } as CommandContext['user']),
    services: {} as CommandContext['services'],
    dataLoaders: {} as CommandContext['dataLoaders'],
    requestInfo: {} as CommandContext['requestInfo'],
    entityManager,
    contextType: 'command',
    logger: {
      child: jest.fn().mockReturnThis(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      auditEvent: jest.fn(),
      withMeta: jest.fn().mockReturnThis(),
      mergeMeta: jest.fn(),
    } as unknown as LoggerWithMetaControl,
  }
}

describe('ProcessMDocPresentationResponseCommand — presentation flow linking', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    userInvariantMock.mockImplementation(() => undefined)
    publishPresentationFlowEventMock.mockResolvedValue(undefined)
    createOrUpdateIdentityMock.mockResolvedValue({ id: 'identity-id' } as never)
  })

  it('does not populate dataResultsJson on the presentation flow entity', async () => {
    const cacheGet = jest.fn().mockResolvedValue(buildMockCacheResult({ presentationFlowId: 'flow-id-1' }))
    const cacheDelete = jest.fn().mockResolvedValue(undefined)
    mdocRequestDetailsCacheMock.mockReturnValue({ get: cacheGet, delete: cacheDelete } as never)

    decodeAndValidateMock.mockResolvedValue(
      buildMockDecodedResponse([
        { namespace: 'org.iso.18013.5.1', elementIdentifier: 'family_name', elementValue: 'Smith' },
        { namespace: 'org.iso.18013.5.1', elementIdentifier: 'given_name', elementValue: 'Jane' },
      ]) as never,
    )

    const flow = new PresentationFlowEntity()
    flow.id = 'flow-id-1'
    flow.type = 'mdoc'
    flow.dataSchemaJson = JSON.stringify([
      { id: 'org.iso.18013.5.1/family_name', type: DataType.Text, label: 'family_name', required: false },
      { id: 'org.iso.18013.5.1/given_name', type: DataType.Text, label: 'given_name', required: false },
    ])
    flow.actionsJson = null
    flow.autoSubmit = null
    flow.presentationId = null
    flow.dataResultsJson = null

    const context = createContext(flow)
    const flowRepo = context.entityManager.getRepository(PresentationFlowEntity) as unknown as jest.Mocked<{
      findOneByOrFail: jest.Mock
      save: jest.Mock
    }>
    flowRepo.findOneByOrFail.mockResolvedValue(flow)

    await ProcessMDocPresentationResponseCommand.call(context, { requestId: 'req-1', response: 'mock-response' })

    expect(flowRepo.save).toHaveBeenCalled()
    const savedFlow = flowRepo.save.mock.calls[0]![0] as PresentationFlowEntity
    // mDoc flows must NOT capture raw wallet claims into dataResultsJson
    expect(savedFlow.dataResultsJson).toBeNull()
    // mDoc flows should still auto-submit even though dataSchema is populated (claims are display-only)
    expect(savedFlow.isSubmitted).toBe(true)
  })

  it('does not touch the flow when there is no presentation flow linked', async () => {
    const cacheGet = jest.fn().mockResolvedValue(buildMockCacheResult({ presentationFlowId: undefined }))
    const cacheDelete = jest.fn().mockResolvedValue(undefined)
    mdocRequestDetailsCacheMock.mockReturnValue({ get: cacheGet, delete: cacheDelete } as never)

    decodeAndValidateMock.mockResolvedValue(
      buildMockDecodedResponse([{ namespace: 'org.iso.18013.5.1', elementIdentifier: 'family_name', elementValue: 'Jones' }]) as never,
    )

    const context = createContext()
    const flowRepo = context.entityManager.getRepository(PresentationFlowEntity) as unknown as jest.Mocked<{
      findOneByOrFail: jest.Mock
      save: jest.Mock
    }>

    const result = await ProcessMDocPresentationResponseCommand.call(context, { requestId: 'req-1', response: 'mock-response' })

    expect(flowRepo.findOneByOrFail).not.toHaveBeenCalled()
    expect(flowRepo.save).not.toHaveBeenCalled()
    expect(result.documents[0]!.namespaces[0]!.claims[0]!.elementValue).toBe('Jones')
  })

  it('rejects cross-flow submission when using a limited presentation flow token', async () => {
    const cacheGet = jest.fn().mockResolvedValue(buildMockCacheResult({ presentationFlowId: 'flow-id-1' }))
    const cacheDelete = jest.fn().mockResolvedValue(undefined)
    mdocRequestDetailsCacheMock.mockReturnValue({ get: cacheGet, delete: cacheDelete } as never)

    decodeAndValidateMock.mockResolvedValue(
      buildMockDecodedResponse([{ namespace: 'org.iso.18013.5.1', elementIdentifier: 'family_name', elementValue: 'Smith' }]) as never,
    )

    const context = createContext(undefined, {
      token: 'tok',
      entity: { id: 'user-id' },
      limitedPresentationFlowData: { presentationFlowId: 'flow-id-2' },
    } as CommandContext['user'])
    // Simulate a limited presentation flow token for a different flow

    await expect(ProcessMDocPresentationResponseCommand.call(context, { requestId: 'req-1', response: 'mock-response' })).rejects.toThrow(
      /does not belong to the presentation flow/i,
    )
  })

  it('allows submission when limited token matches the request flow', async () => {
    const cacheGet = jest.fn().mockResolvedValue(buildMockCacheResult({ presentationFlowId: 'flow-id-1' }))
    const cacheDelete = jest.fn().mockResolvedValue(undefined)
    mdocRequestDetailsCacheMock.mockReturnValue({ get: cacheGet, delete: cacheDelete } as never)

    decodeAndValidateMock.mockResolvedValue(
      buildMockDecodedResponse([{ namespace: 'org.iso.18013.5.1', elementIdentifier: 'family_name', elementValue: 'Smith' }]) as never,
    )

    const flow = new PresentationFlowEntity()
    flow.id = 'flow-id-1'
    flow.type = 'mdoc'
    flow.dataSchemaJson = JSON.stringify([
      { id: 'org.iso.18013.5.1/family_name', type: DataType.Text, label: 'family_name', required: false },
    ])
    flow.actionsJson = null
    flow.autoSubmit = null
    flow.presentationId = null
    flow.dataResultsJson = null

    const context = createContext(flow, {
      token: 'tok',
      entity: { id: 'user-id' },
      limitedPresentationFlowData: { presentationFlowId: 'flow-id-1' },
    } as CommandContext['user'])
    // Simulate a limited presentation flow token for the matching flow

    const flowRepo = context.entityManager.getRepository(PresentationFlowEntity) as unknown as jest.Mocked<{
      findOneByOrFail: jest.Mock
      save: jest.Mock
    }>
    flowRepo.findOneByOrFail.mockResolvedValue(flow)

    const result = await ProcessMDocPresentationResponseCommand.call(context, { requestId: 'req-1', response: 'mock-response' })

    expect(result._presentationFlowId).toBe('flow-id-1')
    expect(flowRepo.save).toHaveBeenCalled()
  })
})
