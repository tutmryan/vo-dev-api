import type { ClaimsParameter } from 'oidc-provider'
import type { ClaimConstraint, PresentedCredential } from '../../../generated/graphql'
import { InvariantError } from '../../../util/invariant'
import { StandardClaims } from '../../contracts/claims'
import { supportedAcrs, supportedAmrs } from '../claims'
import type { LoginInteractionData } from '../session'
import { addEamPresentationConstraints, getEamAccountId, getEamAcr, getEamAmr } from './entra-eam'

const baseLoginData = (): LoginInteractionData => ({
  state: 'started',
  interactionId: 'interaction-1',
  clientId: 'client-1',
  sessionKey: 'session-key-1',
  integrations: {
    entraEam: {
      sub: 'sub-abc',
      identityId: 'identity-123',
    },
  },
})

const withRequestedClaims = (requestedClaims: ClaimsParameter): LoginInteractionData => ({
  ...baseLoginData(),
  requestedClaims,
})

describe('addEamPresentationConstraints', () => {
  const identityIdConstraintMatcher = (identityId: string) => ({
    claimName: StandardClaims.identityId,
    values: [identityId],
  })

  it('adds identityId constraint when no prior constraints provided (undefined)', () => {
    // Arrange
    const loginData = baseLoginData()

    // Act
    const result = addEamPresentationConstraints(loginData, undefined)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(identityIdConstraintMatcher(loginData.integrations!.entraEam!.identityId!))
  })

  it('adds identityId constraint when prior constraints is an empty array (non-mutation semantics)', () => {
    // Arrange
    const loginData = baseLoginData()
    const originalConstraints: ClaimConstraint[] = []

    // Act
    const result = addEamPresentationConstraints(loginData, originalConstraints)

    // Assert - new array returned
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(identityIdConstraintMatcher(loginData.integrations!.entraEam!.identityId!))
  })

  it('appends identityId constraint after existing constraints preserving order and references', () => {
    // Arrange
    const loginData = baseLoginData()
    const existingConstraint: ClaimConstraint = { claimName: 'someClaim', values: ['someValue'] }

    // Act
    const result = addEamPresentationConstraints(loginData, [existingConstraint])

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(existingConstraint)
    expect(result[1]).toEqual(identityIdConstraintMatcher(loginData.integrations!.entraEam!.identityId!))
  })

  it('throws when EAM integration data is missing', () => {
    // Arrange
    const loginData = baseLoginData()
    delete loginData.integrations?.entraEam

    // Act & Assert
    expect(() => addEamPresentationConstraints(loginData)).toThrow(InvariantError)
    expect(() => addEamPresentationConstraints(loginData)).toThrow('EAM integration not found during constraint build')
  })

  it('throws when identityId is missing inside EAM integration', () => {
    // Arrange
    const loginData = baseLoginData()
    delete loginData.integrations?.entraEam?.identityId

    // Act & Assert
    expect(() => addEamPresentationConstraints(loginData)).toThrow(InvariantError)
    expect(() => addEamPresentationConstraints(loginData)).toThrow('Identity ID not found during EAM identity constraint build')
  })
})

describe('getEamAmr', () => {
  it('returns first supported AMR when no specific amr claim is requested', () => {
    // Arrange
    const loginData = withRequestedClaims({})

    // Act
    const result = getEamAmr(loginData)

    // Assert
    expect(result).toEqual([supportedAmrs[0]])
  })

  it('returns only the first matching supported AMR when multiple requested values match', () => {
    // Arrange
    const loginData = withRequestedClaims({
      id_token: {
        amr: {
          values: ['face', 'fido', 'fpt', 'hwk', 'iris', 'otp', 'tel', 'pop', 'retina', 'sc', 'sms', 'swk', 'vbm', 'bio'],
        },
      },
    })

    // Act
    const result = getEamAmr(loginData)

    // Assert
    expect(result).toEqual(['face'])
  })

  it('returns fallback first supported AMR when requested values contain no supported entries', () => {
    // Arrange
    const loginData = withRequestedClaims({
      id_token: {
        amr: {
          values: ['unsupported_1', 'unsupported_2'],
        },
      },
    })

    // Act
    const result = getEamAmr(loginData)

    // Assert
    expect(result).toEqual([supportedAmrs[0]])
  })
})

describe('getEamAcr', () => {
  it('returns the default ACR when no specific acr claim is requested', () => {
    // Arrange
    const loginData = withRequestedClaims({
      id_token: {},
    })

    // Act
    const result = getEamAcr(loginData)

    // Assert
    expect(result).toEqual('possessionorinherence')
  })

  it('returns the default ACR when requested', () => {
    // Arrange
    const loginData = withRequestedClaims({
      id_token: {
        acr: {
          value: 'possessionorinherence',
        },
      },
    })

    // Act
    const result = getEamAcr(loginData)

    // Assert
    expect(result).toEqual('possessionorinherence')
  })

  test.each([...supportedAcrs])('returns the %s ACR when requested', (acr: string) => {
    // Arrange
    const loginData = withRequestedClaims({
      id_token: {
        acr: {
          value: acr,
        },
      },
    })

    // Act
    const result = getEamAcr(loginData)

    // Assert
    expect(result).toEqual(acr)
  })
})

describe('getEamAccountId', () => {
  const baseCredential = (): PresentedCredential => ({
    __typename: 'PresentedCredential',
    claims: {
      [StandardClaims.identityId]: baseLoginData().integrations!.entraEam!.identityId,
      [StandardClaims.issuanceId]: 'issuance-2',
    },
    credentialState: {},
    issuer: 'issuer-1',
    type: [],
  })

  it('returns sub when identityId matches (case-insensitive)', () => {
    // Arrange
    const loginData = baseLoginData()
    const credential = baseCredential()
    credential.claims[StandardClaims.identityId] = loginData.integrations!.entraEam!.identityId?.toLocaleUpperCase()

    // Act
    const result = getEamAccountId(loginData, credential)

    // Assert
    expect(result).toBe(loginData.integrations!.entraEam!.sub)
  })

  it('throws when EAM integration data is missing', () => {
    // Arrange
    const loginData = baseLoginData()
    delete loginData.integrations?.entraEam
    const credential = baseCredential()

    // Act & Assert
    expect(() => getEamAccountId(loginData, credential)).toThrow(InvariantError)
    expect(() => getEamAccountId(loginData, credential)).toThrow('EAM integration not found during constraint build')
  })

  it('throws when identityId does not match', () => {
    // Arrange
    const loginData = baseLoginData()
    const credential = baseCredential()
    credential.claims[StandardClaims.identityId] = 'different-identity-id'

    // Act & Assert
    expect(() => getEamAccountId(loginData, credential)).toThrow(InvariantError)
    expect(() => getEamAccountId(loginData, credential)).toThrow('Identity ID mismatch during EAM OIDC account ID check')
  })
})
