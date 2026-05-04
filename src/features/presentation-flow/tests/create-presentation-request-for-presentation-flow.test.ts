import type { CommandContext } from '../../../cqs'
import type { VerifiedOrchestrationEntityManager } from '../../../data/entity-manager'
import type { LoggerWithMetaControl } from '../../../logger'
import { userInvariant } from '../../../util/user-invariant'
import { getLimitedPresentationFlowKey } from '../../limited-presentation-flow-tokens'
import { CreateMDocPresentationRequestCommand } from '../../presentation/commands/create-mdoc-presentation-request-command'
import { CreatePresentationRequestCommand } from '../../presentation/commands/create-presentation-request-command'
import { CreatePresentationRequestForPresentationFlowCommand } from '../commands/create-presentation-request-for-presentation-flow-command'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

jest.mock('../../../util/user-invariant')
jest.mock('../../presentation/commands/create-presentation-request-command')
jest.mock('../../presentation/commands/create-mdoc-presentation-request-command')
jest.mock('../../limited-presentation-flow-tokens')
jest.mock('../pubsub')

const userInvariantMock = userInvariant as jest.MockedFunction<typeof userInvariant>
const getLimitedPresentationFlowKeyMock = getLimitedPresentationFlowKey as jest.MockedFunction<typeof getLimitedPresentationFlowKey>

function createContext(overrides: Partial<CommandContext> = {}): CommandContext {
  const entityManager = {
    getRepository: jest.fn().mockReturnValue({
      findOneOrFail: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
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
  entity.type = 'vc'
  entity.expiresAt = new Date(Date.now() + 86400000)
  entity.presentationRequestJson = JSON.stringify({
    registration: { clientName: 'Test' },
    requestedCredentials: [{ type: 'TestCredential', acceptedIssuers: ['did:example:123'] }],
  })
  entity.mdocRequestJson = null
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
    ;(CreateMDocPresentationRequestCommand.apply as jest.Mock) = jest.fn().mockResolvedValue({
      requestId: 'mdoc-req-id',
      request: { deviceRequest: 'base64data', encryptionInfo: 'base64enc' },
      expiry: Date.now() + 1000,
    })
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

  it('succeeds when presentation flow is in PresentationVerified status (retry path)', async () => {
    const entity = createPresentationFlowEntity({ presentationId: 'existing-presentation-id' })
    ;(context.entityManager.getRepository(PresentationFlowEntity).findOneOrFail as jest.Mock).mockResolvedValue(entity)

    await expect(CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)).resolves.not.toThrow()
    expect(CreatePresentationRequestCommand.apply).toHaveBeenCalled()
  })

  it('writes isRequestCreated via update() by PK after the external call, not via save()', async () => {
    const entity = createPresentationFlowEntity()
    const repo = context.entityManager.getRepository(PresentationFlowEntity)
    ;(repo.findOneOrFail as jest.Mock).mockResolvedValue(entity)

    await CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)

    expect(repo.update).toHaveBeenCalledWith(presentationFlowId, { isRequestCreated: true })
    expect(repo.save).not.toHaveBeenCalled()
  })

  describe('mDoc branch', () => {
    it('dispatches CreateMDocPresentationRequestCommand for mdoc type flows', async () => {
      const mdocRequest = {
        docType: 'org.iso.18013.5.1.mDL',
        requestedClaims: [{ path: ['org.iso.18013.5.1', 'family_name'] }],
      }
      const entity = createPresentationFlowEntity({
        type: 'mdoc',
        presentationRequestJson: null,
        mdocRequestJson: JSON.stringify(mdocRequest),
      })
      ;(context.entityManager.getRepository(PresentationFlowEntity).findOneOrFail as jest.Mock).mockResolvedValue(entity)

      await CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)

      expect(CreateMDocPresentationRequestCommand.apply).toHaveBeenCalledWith(context, [
        expect.objectContaining({ docType: 'org.iso.18013.5.1.mDL' }),
      ])
      expect(CreatePresentationRequestCommand.apply).not.toHaveBeenCalled()
    })

    it('always overwrites signing.expectedOrigins with the portal origin, regardless of what is persisted on the flow', async () => {
      // Regression: if a client (e.g. composer) persisted its own origin into the flow's
      // mdocRequestJson.signing.expectedOrigins, the ISO 18013-7 SessionTranscript would be
      // built with the wrong origin and the wallet would reject the signed reader auth.
      const entity = createPresentationFlowEntity({
        type: 'mdoc',
        presentationRequestJson: null,
        mdocRequestJson: JSON.stringify({
          docType: 'org.iso.18013.5.1.mDL',
          requestedClaims: [{ path: ['org.iso.18013.5.1', 'family_name'] }],
          signing: { expectedOrigins: ['https://some-other-origin.example.com'] },
        }),
      })
      ;(context.entityManager.getRepository(PresentationFlowEntity).findOneOrFail as jest.Mock).mockResolvedValue(entity)

      await CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)

      expect(CreateMDocPresentationRequestCommand.apply).toHaveBeenCalledWith(context, [
        expect.objectContaining({
          signing: expect.objectContaining({
            expectedOrigins: ['https://test.portal.verifiedorchestration.com'],
          }),
        }),
      ])
    })

    it('injects portal origin when the flow has no signing config at all', async () => {
      const entity = createPresentationFlowEntity({
        type: 'mdoc',
        presentationRequestJson: null,
        mdocRequestJson: JSON.stringify({
          docType: 'org.iso.18013.5.1.mDL',
          requestedClaims: [{ path: ['org.iso.18013.5.1', 'family_name'] }],
        }),
      })
      ;(context.entityManager.getRepository(PresentationFlowEntity).findOneOrFail as jest.Mock).mockResolvedValue(entity)

      await CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)

      expect(CreateMDocPresentationRequestCommand.apply).toHaveBeenCalledWith(context, [
        expect.objectContaining({
          signing: { expectedOrigins: ['https://test.portal.verifiedorchestration.com'] },
        }),
      ])
    })

    it('does not call VC command for mdoc type flows', async () => {
      const entity = createPresentationFlowEntity({
        type: 'mdoc',
        presentationRequestJson: null,
        mdocRequestJson: JSON.stringify({ docType: 'org.iso.18013.5.1.mDL', requestedClaims: [{ path: ['ns', 'claim'] }] }),
      })
      ;(context.entityManager.getRepository(PresentationFlowEntity).findOneOrFail as jest.Mock).mockResolvedValue(entity)

      await CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)

      expect(CreatePresentationRequestCommand.apply).not.toHaveBeenCalled()
    })

    it('still writes isRequestCreated after mDoc request', async () => {
      const entity = createPresentationFlowEntity({
        type: 'mdoc',
        presentationRequestJson: null,
        mdocRequestJson: JSON.stringify({ docType: 'org.iso.18013.5.1.mDL', requestedClaims: [{ path: ['ns', 'claim'] }] }),
      })
      const repo = context.entityManager.getRepository(PresentationFlowEntity)
      ;(repo.findOneOrFail as jest.Mock).mockResolvedValue(entity)

      await CreatePresentationRequestForPresentationFlowCommand.call(context, presentationFlowId)

      expect(repo.update).toHaveBeenCalledWith(presentationFlowId, { isRequestCreated: true })
    })
  })
})
