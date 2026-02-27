import type { CommandContext } from '../../../cqs'
import type { VerifiedOrchestrationEntityManager } from '../../../data/entity-manager'
import type { LoggerWithMetaControl } from '../../../logger'
import { userInvariant } from '../../../util/user-invariant'
import { getLimitedPresentationFlowKey } from '../../limited-presentation-flow-tokens'
import { CreatePresentationRequestCommand } from '../../presentation/commands/create-presentation-request-command'
import { CreatePresentationRequestForPresentationFlowCommand } from '../commands/create-presentation-request-for-presentation-flow-command'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

jest.mock('../../../util/user-invariant')
jest.mock('../../presentation/commands/create-presentation-request-command')
jest.mock('../../limited-presentation-flow-tokens')
jest.mock('../pubsub')

const userInvariantMock = userInvariant as jest.MockedFunction<typeof userInvariant>
const getLimitedPresentationFlowKeyMock = getLimitedPresentationFlowKey as jest.MockedFunction<typeof getLimitedPresentationFlowKey>

function createContext(overrides: Partial<CommandContext> = {}): CommandContext {
  const entityManager = {
    getRepository: jest.fn().mockReturnValue({
      findOneOrFail: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    }),
  } as unknown as VerifiedOrchestrationEntityManager

  const base: CommandContext = {
    user: undefined,
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

  return { ...base, ...overrides }
}

function createPresentationFlowEntity(overrides: Partial<PresentationFlowEntity> = {}): PresentationFlowEntity {
  const entity = new PresentationFlowEntity()
  entity.expiresAt = new Date(Date.now() + 86400000)
  entity.presentationRequestJson = JSON.stringify({
    registration: { clientName: 'Test' },
    requestedCredentials: [{ type: 'TestCredential', acceptedIssuers: ['did:example:123'] }],
  })
  entity.isRequestCreated = null
  entity.isRequestRetrieved = null
  entity.isCancelled = null
  entity.isSubmitted = null
  entity.presentationId = null
  Object.assign(entity, overrides)
  return entity
}

describe('CreatePresentationRequestForPresentationFlowCommand', () => {
  let context: CommandContext
  const presentationFlowId = 'test-flow-id'

  beforeEach(() => {
    jest.resetAllMocks()

    context = createContext({
      user: { token: 'user-token', entity: { id: 'user-id' } } as CommandContext['user'],
    })

    userInvariantMock.mockImplementation(() => undefined)
    getLimitedPresentationFlowKeyMock.mockReturnValue('limited-key')
    ;(CreatePresentationRequestCommand.apply as jest.Mock) = jest
      .fn()
      .mockResolvedValue({ requestId: 'req-id', url: 'https://example.com', qrCode: 'qr', expiry: Date.now() + 1000 })
  })

  it('passes presentationFlowId in the context to CreatePresentationRequestCommand', async () => {
    const entity = createPresentationFlowEntity()
    ;(context.entityManager.getRepository(PresentationFlowEntity).findOneOrFail as jest.Mock).mockResolvedValue(entity)

    await CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)

    expect(CreatePresentationRequestCommand.apply).toHaveBeenCalledWith(context, [
      expect.objectContaining({
        requestedCredentials: expect.any(Array),
      }),
      { limitedPresentationFlowKey: 'limited-key', presentationFlowId },
    ])
  })

  it('throws when presentation flow is not pending', async () => {
    const entity = createPresentationFlowEntity({ isSubmitted: true })
    ;(context.entityManager.getRepository(PresentationFlowEntity).findOneOrFail as jest.Mock).mockResolvedValue(entity)

    await expect(CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)).rejects.toThrow('no longer pending')
  })

  it('forwards includeQRCode from input', async () => {
    const entity = createPresentationFlowEntity()
    ;(context.entityManager.getRepository(PresentationFlowEntity).findOneOrFail as jest.Mock).mockResolvedValue(entity)

    await CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId, { includeQRCode: true })

    expect(CreatePresentationRequestCommand.apply).toHaveBeenCalledWith(context, [
      expect.objectContaining({ includeQRCode: true }),
      expect.any(Object),
    ])
  })
})
