import { OidcClientType, OidcTokenEndpointAuthMethod, type OidcClientInput } from '../../../generated/graphql'
import { validateClientAuthMethod, validateJarKeys, validateJwksJson } from './utils'

describe('validateJwksJson', () => {
  it('should pass for undefined value', () => {
    expect(() => validateJwksJson(undefined, 'testField')).not.toThrow()
  })

  it('should pass for null value', () => {
    expect(() => validateJwksJson(null, 'testField')).not.toThrow()
  })

  it('should pass for valid single JWK with kty', () => {
    const jwk = {
      kty: 'RSA',
      n: 'test-n',
      e: 'AQAB',
      kid: 'test-key-1',
      use: 'sig',
      alg: 'RS256',
    }
    expect(() => validateJwksJson(jwk, 'testField')).not.toThrow()
  })

  it('should pass for valid JWKS with keys array', () => {
    const jwks = {
      keys: [
        { kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1', use: 'sig', alg: 'RS256' },
        { kty: 'RSA', n: 'test-n2', e: 'AQAB', kid: 'test-key-2', use: 'sig', alg: 'RS256' },
      ],
    }
    expect(() => validateJwksJson(jwks, 'testField')).not.toThrow()
  })

  it('should pass for JWKS with empty keys array', () => {
    const jwks = { keys: [] }
    expect(() => validateJwksJson(jwks, 'testField')).not.toThrow()
  })

  it('should fail for valid JSON without kty or keys', () => {
    const invalidJwk = { foo: 'bar', baz: 'qux' }
    expect(() => validateJwksJson(invalidJwk, 'testField')).toThrow('testField must be valid JSON containing a JWK or JWKS object')
  })

  it('should fail for empty object', () => {
    const emptyObj = {}
    expect(() => validateJwksJson(emptyObj, 'testField')).toThrow('testField must be valid JSON containing a JWK or JWKS object')
  })

  it('should include field name in error message for invalid structure', () => {
    const invalidStructure = { invalid: 'structure' }
    expect(() => validateJwksJson(invalidStructure, 'relyingPartyJwks')).toThrow(
      'relyingPartyJwks must be valid JSON containing a JWK or JWKS object',
    )
  })

  it('should pass for real-world RSA JWK', () => {
    const realJwk = {
      kty: 'RSA',
      kid: 'oy8rzA35TSRmYasx75lJYESAtnhTpUBiiiMWVQSM708',
      use: 'sig',
      x5c: ['MIIDqjCCApKgAwIBAgIGAZy739blMA0GCSqGSIb3DQEBCwUAMIGVMQswCQYDVQQGEwJVUzETMBEGA1UE...'],
      'x5t#S256': 'YcyBB1nEzMpY3_1VL9zgET6Dt3Qclb-C_U-lqR5KdyE',
      e: 'AQAB',
      n: 'q1qWk-GFHmo__kJ7EYsptdpb3sHGdIgrOEWjatUUnWbLV4CzAusFhJnDv-3mbtsL4DWWpSDEdJbEJhJSbQMsdi1...',
    }
    expect(() => validateJwksJson(realJwk, 'testField')).not.toThrow()
  })
})

describe('validateClientAuthMethod', () => {
  it('should default to ClientSecretPost for confidential clients', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      clientSecret: 'a'.repeat(64),
    }
    const result = validateClientAuthMethod(input)
    expect(result).toEqual(OidcTokenEndpointAuthMethod.ClientSecretPost)
  })

  it('should default to None for public clients', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Public,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
    }
    const result = validateClientAuthMethod(input)
    expect(result).toEqual(OidcTokenEndpointAuthMethod.None)
  })

  it('should enforce mutual exclusivity of clientJwks and clientJwksUri', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      clientJwks: { kty: 'RSA' },
      clientJwksUri: 'https://example.com/jwks.json',
    }
    expect(() => validateClientAuthMethod(input)).toThrow('clientJwks and clientJwksUri are mutually exclusive')
  })

  it('should enforce mutual exclusivity of relyingPartyJwks and relyingPartyJwksUri', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      clientSecret: 'a'.repeat(64),
      relyingPartyJwks: { kty: 'RSA' },
      relyingPartyJwksUri: 'https://example.com/jwks.json',
    }
    expect(() => validateClientAuthMethod(input)).toThrow('relyingPartyJwks and relyingPartyJwksUri are mutually exclusive')
  })

  it('should require PrivateKeyJwt clients to have JWKS', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
    }
    expect(() => validateClientAuthMethod(input)).toThrow('private_key_jwt clients must have clientJwks or clientJwksUri')
  })

  it('should not allow PrivateKeyJwt clients to have a secret', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      clientJwks: { kty: 'RSA' },
      clientSecret: 'a'.repeat(64),
    }
    expect(() => validateClientAuthMethod(input)).toThrow('private_key_jwt clients cannot have a secret, use client_secret_post instead')
  })

  it('should not allow ClientSecretPost clients to have JWKS', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.ClientSecretPost,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      clientSecret: 'a'.repeat(64),
      clientJwks: { kty: 'RSA' },
    }
    expect(() => validateClientAuthMethod(input)).toThrow('client_secret_post clients cannot have JWKS, use private_key_jwt instead')
  })

  it('should not allow public clients to have JWKS', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Public,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      clientJwks: { kty: 'RSA' },
    }
    expect(() => validateClientAuthMethod(input)).toThrow('Public clients cannot have JWKS')
  })
})

describe('validateJarKeys', () => {
  it('should pass when JAR is disabled', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      authorizationRequestsTypeJarEnabled: false,
    }
    expect(() => validateJarKeys(input, OidcTokenEndpointAuthMethod.ClientSecretPost)).not.toThrow()
  })

  it('should pass when JAR is enabled with ClientSecretPost', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      authorizationRequestsTypeJarEnabled: true,
    }
    expect(() => validateJarKeys(input, OidcTokenEndpointAuthMethod.ClientSecretPost)).not.toThrow()
  })

  it('should require relyingPartyJwks or relyingPartyJwksUri when JAR is enabled without ClientSecretPost', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      authorizationRequestsTypeJarEnabled: true,
    }
    expect(() => validateJarKeys(input, OidcTokenEndpointAuthMethod.PrivateKeyJwt)).toThrow(
      'JAR-enabled clients must have relyingPartyJwks or relyingPartyJwksUri (unless using client_secret_post)',
    )
  })

  it('should pass when JAR is enabled with relyingPartyJwks', () => {
    const input: OidcClientInput = {
      name: 'test',
      clientType: OidcClientType.Confidential,
      redirectUris: ['https://example.com/callback'],
      postLogoutUris: [],
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwks: { kty: 'RSA' },
    }
    expect(() => validateJarKeys(input, OidcTokenEndpointAuthMethod.PrivateKeyJwt)).not.toThrow()
  })
})
