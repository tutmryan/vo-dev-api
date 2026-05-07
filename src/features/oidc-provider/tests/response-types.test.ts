import { OidcResponseType } from '../../../generated/graphql'
import { validateResponseTypes } from '../commands/utils'
import { toOidcProviderResponseTypes } from '../data'

describe('toOidcProviderResponseTypes', () => {
  describe('valid mappings', () => {
    it('maps [CODE] to ["code"]', () => {
      expect(toOidcProviderResponseTypes([OidcResponseType.Code])).toEqual(['code'])
    })

    it('maps [CODE, ID_TOKEN] to all 3 permutations for hybrid flow', () => {
      expect(toOidcProviderResponseTypes([OidcResponseType.Code, OidcResponseType.IdToken])).toEqual(['code', 'id_token', 'code id_token'])
    })

    it('maps [ID_TOKEN, CODE] to all 3 permutations regardless of order', () => {
      expect(toOidcProviderResponseTypes([OidcResponseType.IdToken, OidcResponseType.Code])).toEqual(['code', 'id_token', 'code id_token'])
    })

    it('maps [ID_TOKEN] to ["id_token"]', () => {
      expect(toOidcProviderResponseTypes([OidcResponseType.IdToken])).toEqual(['id_token'])
    })

    it('maps empty array to ["code"] (default)', () => {
      expect(toOidcProviderResponseTypes([])).toEqual(['code'])
    })
  })

  describe('output size', () => {
    it('returns one response_type value for CODE only', () => {
      expect(toOidcProviderResponseTypes([OidcResponseType.Code])).toHaveLength(1)
    })

    it('returns three response_type values for hybrid flow', () => {
      expect(toOidcProviderResponseTypes([OidcResponseType.Code, OidcResponseType.IdToken])).toHaveLength(3)
    })

    it('returns one response_type value for ID_TOKEN only', () => {
      expect(toOidcProviderResponseTypes([OidcResponseType.IdToken])).toHaveLength(1)
    })
  })
})

describe('validateResponseTypes', () => {
  describe('valid configurations', () => {
    it('allows null (caller defaults to [CODE])', () => {
      expect(() => validateResponseTypes(null)).not.toThrow()
    })

    it('allows undefined (caller defaults to [CODE])', () => {
      expect(() => validateResponseTypes(undefined)).not.toThrow()
    })

    it('allows [CODE]', () => {
      expect(() => validateResponseTypes([OidcResponseType.Code])).not.toThrow()
    })

    it('allows [ID_TOKEN]', () => {
      expect(() => validateResponseTypes([OidcResponseType.IdToken])).not.toThrow()
    })

    it('allows [CODE, ID_TOKEN]', () => {
      expect(() => validateResponseTypes([OidcResponseType.Code, OidcResponseType.IdToken])).not.toThrow()
    })

    it('allows [ID_TOKEN, CODE] regardless of order', () => {
      expect(() => validateResponseTypes([OidcResponseType.IdToken, OidcResponseType.Code])).not.toThrow()
    })
  })

  describe('invalid configurations', () => {
    it('rejects empty array', () => {
      expect(() => validateResponseTypes([])).toThrow('Response types must not be empty when specified')
    })

    it('rejects duplicate response types', () => {
      expect(() => validateResponseTypes([OidcResponseType.Code, OidcResponseType.Code])).toThrow(
        'Duplicate response types are not permitted',
      )
    })
  })
})
