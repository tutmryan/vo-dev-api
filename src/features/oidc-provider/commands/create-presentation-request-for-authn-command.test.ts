import type { CommandContext } from '../../../cqs'
import type { VerifiedOrchestrationEntityManager } from '../../../data/entity-manager'
import { OidcApplicationType, OidcClientType, OidcTokenEndpointAuthMethod } from '../../../generated/graphql'
import type { LoggerWithMetaControl } from '../../../logger'
import { InvariantError } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import type { PartnerEntity } from '../../partners/entities/partner-entity'
import { CreatePresentationRequestCommand } from '../../presentation/commands/create-presentation-request-command'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import type { LoginInteractionData } from '../session'
import { getInteractionId, getLoginInteractionDataForSession, getSessionKey, setLoginInteractionData } from '../session'
import { CreatePresentationRequestForAuthnCommand } from './create-presentation-request-for-authn-command'

jest.mock('../../../util/user-invariant')
jest.mock('../session')
jest.mock('../../presentation/commands/create-presentation-request-command')

const userInvariantMock = userInvariant as jest.MockedFunction<typeof userInvariant>
const getSessionKeyMock = getSessionKey as jest.MockedFunction<typeof getSessionKey>
const getInteractionIdMock = getInteractionId as jest.MockedFunction<typeof getInteractionId>
const getLoginInteractionDataForSessionMock = getLoginInteractionDataForSession as jest.MockedFunction<
  typeof getLoginInteractionDataForSession
>
const setLoginInteractionDataMock = setLoginInteractionData as jest.MockedFunction<typeof setLoginInteractionData>

function createContext(overrides: Partial<CommandContext> = {}): CommandContext {
  const entityManager = {
    getRepository: jest.fn().mockReturnValue({
      findOneByOrFail: jest.fn(),
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
    } as unknown as LoggerWithMetaControl,
  }

  return {
    ...base,
    ...overrides,
  }
}

function createClient(overrides: Partial<OidcClientEntity> = {}): OidcClientEntity {
  return new OidcClientEntity({
    id: 'client-id',
    name: 'Test Client',
    applicationType: OidcApplicationType.Web,
    clientType: OidcClientType.Public,
    tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.None,
    redirectUris: ['https://example.com/cb'],
    postLogoutUris: ['https://example.com/logout'],
    credentialTypes: ['TestCredential'],
    ...overrides,
  })
}

const baseLoginInteractionData = {
  state: 'started' as const,
  requestedCredential: {
    type: 'TestCredential',
    acceptedIssuers: undefined as string[] | undefined,
  },
  clientId: 'client-id',
}

describe('CreatePresentationRequestForAuthnCommand', () => {
  let context: CommandContext
  type ClientWithPartners = OidcClientEntity & { partners: Promise<PartnerEntity[]> }

  beforeEach(() => {
    jest.resetAllMocks()

    context = createContext({
      user: { token: 'user-token' } as CommandContext['user'],
    })
    ;(context.entityManager.getRepository(OidcClientEntity).findOneByOrFail as jest.Mock) = jest.fn().mockResolvedValue(createClient())

    userInvariantMock.mockImplementation((u: unknown) => {
      if (!u) throw new InvariantError('No user')
    })

    getSessionKeyMock.mockReturnValue('authn-session-key')
    getInteractionIdMock.mockResolvedValue('interaction-id')
    getLoginInteractionDataForSessionMock.mockResolvedValue(baseLoginInteractionData as unknown as LoginInteractionData)
    ;(CreatePresentationRequestCommand.apply as jest.Mock) = jest
      .fn()
      .mockResolvedValue({ requestId: 'req-id', url: 'https://example.com', qrCode: 'qr', expiry: Date.now() + 1000 })

    setLoginInteractionDataMock.mockResolvedValue(undefined)
  })

  it('creates a presentation request and updates login interaction state when url is present', async () => {
    const result = await CreatePresentationRequestForAuthnCommand.call(context)

    expect(CreatePresentationRequestCommand.apply).toHaveBeenCalledWith(context, [
      {
        includeQRCode: true,
        registration: { clientName: 'Test Client' },
        requestedCredentials: [baseLoginInteractionData.requestedCredential],
      },
      { authnSessionKey: 'authn-session-key' },
    ])

    expect(setLoginInteractionDataMock).toHaveBeenCalledWith({
      ...baseLoginInteractionData,
      state: 'in-progress',
      requestId: 'req-id',
    })

    expect(result).toEqual({ requestId: 'req-id', url: 'https://example.com', qrCode: 'qr', expiry: expect.any(Number) })
  })

  it('does not update login interaction state when response has no url (non-redirect response)', async () => {
    ;(CreatePresentationRequestCommand.apply as jest.Mock).mockResolvedValueOnce({
      requestId: 'req-id',
    })

    const result = await CreatePresentationRequestForAuthnCommand.call(context)

    expect(setLoginInteractionDataMock).not.toHaveBeenCalled()
    expect(result).toEqual({ requestId: 'req-id' })
  })

  it('throws when no interaction session is found', async () => {
    getInteractionIdMock.mockResolvedValueOnce(undefined)

    await expect(CreatePresentationRequestForAuthnCommand.call(context)).rejects.toThrow('Interaction session not found')
  })

  it('throws when login session data is missing', async () => {
    getLoginInteractionDataForSessionMock.mockResolvedValueOnce(undefined)

    await expect(CreatePresentationRequestForAuthnCommand.call(context)).rejects.toThrow('Login session data not found')
  })

  it('throws when login session state is not started', async () => {
    getLoginInteractionDataForSessionMock.mockResolvedValueOnce({
      ...baseLoginInteractionData,
      state: 'completed',
    } as unknown as LoginInteractionData)

    await expect(CreatePresentationRequestForAuthnCommand.call(context)).rejects.toThrow('Login session is not in the started state')
  })

  it('throws when requested credential is missing', async () => {
    getLoginInteractionDataForSessionMock.mockResolvedValueOnce({
      ...baseLoginInteractionData,
      requestedCredential: undefined,
    } as unknown as LoginInteractionData)

    await expect(CreatePresentationRequestForAuthnCommand.call(context)).rejects.toThrow('No requested credential found')
  })

  it('validates requested credential type against client allowed credential types', async () => {
    ;(context.entityManager.getRepository(OidcClientEntity).findOneByOrFail as jest.Mock).mockResolvedValueOnce(
      createClient({ credentialTypes: ['OtherCredential'] }),
    )

    await expect(CreatePresentationRequestForAuthnCommand.call(context)).rejects.toThrow(
      'Credential type TestCredential is not available to client: Test Client',
    )
  })

  it('validates accepted issuers against client partners when allowAnyPartner is false', async () => {
    const client = createClient() as ClientWithPartners
    client.partners = Promise.resolve([{ did: 'did:partner:1' } as unknown as PartnerEntity])
    ;(context.entityManager.getRepository(OidcClientEntity).findOneByOrFail as jest.Mock).mockResolvedValueOnce(client)

    getLoginInteractionDataForSessionMock.mockResolvedValueOnce({
      ...baseLoginInteractionData,
      requestedCredential: {
        ...baseLoginInteractionData.requestedCredential,
        acceptedIssuers: ['did:partner:2'],
      },
    } as unknown as LoginInteractionData)

    await expect(CreatePresentationRequestForAuthnCommand.call(context)).rejects.toThrow(
      'Issuer did:partner:2 is not allowed for client: Test Client',
    )
  })

  it('allows any issuer when client.allowAnyPartner is true', async () => {
    const client = createClient({
      allowAnyPartner: true,
    })

    ;(context.entityManager.getRepository(OidcClientEntity).findOneByOrFail as jest.Mock).mockResolvedValueOnce(client)

    getLoginInteractionDataForSessionMock.mockResolvedValueOnce({
      ...baseLoginInteractionData,
      requestedCredential: {
        ...baseLoginInteractionData.requestedCredential,
        acceptedIssuers: ['did:unknown:issuer'],
      },
    } as unknown as LoginInteractionData)

    const result = await CreatePresentationRequestForAuthnCommand.call(context)

    expect(result).toBeDefined()
    expect(CreatePresentationRequestCommand.apply).toHaveBeenCalled()
  })
})
