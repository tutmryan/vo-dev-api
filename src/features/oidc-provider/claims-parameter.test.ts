import type { ClaimsParameter, Client, KoaContextWithOIDC } from 'oidc-provider'
import { InvariantError } from '../../util/invariant'
import { supportedAcrs } from './claims'
import { assertClaimsParameter, filterToRequestedClaimsAcr, filterToRequestedClaimsAmr, simplifyClaimParameter } from './claims-parameter'

describe('assertClaimsParameter', () => {
  const mockContext = {} as KoaContextWithOIDC
  const mockClient = {} as Client

  describe('follows the OIDC Spec #5.5', () => {
    it('ignores any members that are not understood', () => {
      // Arrange
      const claimsParameter: ClaimsParameter & { unknownProperty: { some: string } } = {
        id_token: {
          acr: {
            value: supportedAcrs[0],
          },
        },
        unknownProperty: { some: 'value' },
      }

      // Act & Assert - should not throw
      expect(() => assertClaimsParameter(mockContext, claimsParameter, mockClient)).not.toThrow()
    })
  })

  describe('validates a requested claims', () => {
    it('does not error when requesting an acr value that is supported', () => {
      // Arrange
      const claimsParameter: ClaimsParameter = {
        id_token: {
          acr: {
            essential: true,
            value: supportedAcrs[0],
          },
        },
      }

      // Act & Assert
      expect(() => assertClaimsParameter(mockContext, claimsParameter, mockClient)).not.toThrow()
    })

    it('does not error requesting an acr values where one value is supported', () => {
      // Arrange
      const claimsParameter: ClaimsParameter = {
        id_token: {
          acr: {
            essential: true,
            values: ['unsupported_acr_value', supportedAcrs[0]],
          },
        },
      }

      // Act & Assert
      expect(() => assertClaimsParameter(mockContext, claimsParameter, mockClient)).not.toThrow()
    })

    it('does not error requesting an acr value with essential defaulted to false that is not supported', () => {
      // Arrange
      const claimsParameter: ClaimsParameter = {
        id_token: {
          acr: {
            values: ['unsupported_acr_value'],
          },
        },
      }

      // Act & Assert
      expect(() => assertClaimsParameter(mockContext, claimsParameter, mockClient)).not.toThrow()
    })

    it('errors when requesting an acr value that is not supported', () => {
      // Arrange
      const unsupportedAcr = 'unsupported_acr_value'
      const claimsParameter: ClaimsParameter = {
        id_token: {
          acr: {
            essential: true,
            value: unsupportedAcr,
          },
        },
      }

      // Act & Assert
      expect(() => assertClaimsParameter(mockContext, claimsParameter, mockClient)).toThrow(InvariantError)
      expect(() => assertClaimsParameter(mockContext, claimsParameter, mockClient)).toThrow(
        `No valid acr claims found in requested acrs: ${unsupportedAcr}`,
      )
    })

    it('handles acr claim without value or values properties', () => {
      // Arrange
      const claimsParameter: ClaimsParameter = {
        id_token: {
          acr: {
            essential: true,
            // No value or values provided
          },
        },
      }

      // Act & Assert - should not throw since no acr validation is performed without value/values
      expect(() => assertClaimsParameter(mockContext, claimsParameter, mockClient)).not.toThrow()
    })
  })
})

describe('filterToRequestedClaimsAcr', () => {
  it('returns the original acr if no specific acr claim is requested', () => {
    // Arrange
    const acr = supportedAcrs[0]
    const claimsParameter: ClaimsParameter = {}

    // Act
    const result = filterToRequestedClaimsAcr(acr, claimsParameter)

    // Assert
    expect(result).toBe(acr)
  })

  it('returns the requested acr if it is included in the claims parameter', () => {
    // Arrange
    const acr = supportedAcrs[0]
    const claimsParameter: ClaimsParameter = {
      id_token: {
        acr: {
          values: [acr, supportedAcrs[1]],
        },
      },
    }

    // Act
    const result = filterToRequestedClaimsAcr(acr, claimsParameter)

    // Assert
    expect(result).toBe(acr)
  })

  it('returns the first requested acr if the original acr is not included', () => {
    // Arrange
    const acr = supportedAcrs[0]
    const claimsParameter: ClaimsParameter = {
      id_token: {
        acr: {
          values: [supportedAcrs[1], supportedAcrs[1]],
        },
      },
    }

    // Act
    const result = filterToRequestedClaimsAcr(acr, claimsParameter)

    // Assert
    expect(result).toBe(supportedAcrs[1])
  })

  it('ignores unsupported acr values', () => {
    // Arrange
    const acr = supportedAcrs[0]
    const claimsParameter: ClaimsParameter = {
      id_token: {
        acr: {
          values: ['another_acr_value', supportedAcrs[1], 'unsupported_acr_value'],
        },
      },
    }

    // Act
    const result = filterToRequestedClaimsAcr(acr, claimsParameter)

    // Assert
    expect(result).toBe(supportedAcrs[1])
  })
})

describe('filterToRequestedClaimsAmr', () => {
  it('returns the original amr if no specific amr claim is requested', () => {
    // Arrange
    const amr = ['some_amr_value', 'another_amr_value']
    const claimsParameter: ClaimsParameter = {}

    // Act
    const result = filterToRequestedClaimsAmr(amr, claimsParameter)

    // Assert
    expect(result).toStrictEqual(amr)
  })

  it('returns the requested amr if it is included in the claims parameter', () => {
    // Arrange
    const amr = ['some_amr_value', 'another_amr_value']
    const claimsParameter: ClaimsParameter = {
      id_token: {
        amr: {
          values: [...amr, 'some_other_amr_value'],
        },
      },
    }

    // Act
    const result = filterToRequestedClaimsAmr(amr, claimsParameter)

    // Assert
    expect(result).toStrictEqual(amr)
  })

  it('returns the original amr if the requested amr cannot be satisfied', () => {
    // Arrange
    const amr = ['some_amr_value']
    const claimsParameter: ClaimsParameter = {
      id_token: {
        amr: {
          values: ['another_amr_value', 'some_other_amr_value'],
        },
      },
    }

    // Act
    const result = filterToRequestedClaimsAmr(amr, claimsParameter)

    // Assert
    expect(result).toBe(amr)
  })

  it('filters the amr to only include requested values', () => {
    // Arrange
    const amr = ['some_amr_value', 'another_amr_value']
    const claimsParameter: ClaimsParameter = {
      id_token: {
        amr: {
          values: ['another_amr_value', 'some_other_amr_value'],
        },
      },
    }

    // Act
    const result = filterToRequestedClaimsAmr(amr, claimsParameter)

    // Assert
    expect(result).toStrictEqual(['another_amr_value'])
  })

  it('preserves the requested amr order', () => {
    // Arrange
    const amr = ['some_amr_value', 'another_amr_value']
    const claimsParameter: ClaimsParameter = {
      id_token: {
        amr: {
          values: ['another_amr_value', 'some_other_amr_value', 'some_amr_value'],
        },
      },
    }

    // Act
    const result = filterToRequestedClaimsAmr(amr, claimsParameter)

    // Assert
    expect(result).toStrictEqual(['another_amr_value', 'some_amr_value'])
  })
})

describe('simplifyClaimParameter', () => {
  it('returns undefined if no member is provided', () => {
    // Act
    const result = simplifyClaimParameter(undefined)

    // Assert
    expect(result).toBeUndefined()
  })

  it('returns correct object when only value is present', () => {
    // Arrange
    const member = { value: 'foo' }

    // Act
    const result = simplifyClaimParameter(member)

    // Assert
    expect(result).toEqual({ essential: false, values: ['foo'] })
  })

  it('returns correct object when only values is present', () => {
    // Arrange
    const member = { values: ['foo', 'bar'] }

    // Act
    const result = simplifyClaimParameter(member)

    // Assert
    expect(result).toEqual({ essential: false, values: ['foo', 'bar'] })
  })

  it('returns correct essential value when essential is true', () => {
    // Arrange
    const member = { value: 'foo', essential: true }

    // Act
    const result = simplifyClaimParameter(member)

    // Assert
    expect(result).toEqual({ essential: true, values: ['foo'] })
  })

  it('returns correct essential value when essential is false', () => {
    // Arrange
    const member = { value: 'foo', essential: false }

    // Act
    const result = simplifyClaimParameter(member)

    // Assert
    expect(result).toEqual({ essential: false, values: ['foo'] })
  })

  it('filters out falsy values from value and values', () => {
    // Arrange
    const member1 = { values: ['', 'foo', 'bar'] }
    const member2 = { value: undefined }

    // Act
    const result1 = simplifyClaimParameter(member1)
    const result2 = simplifyClaimParameter(member2)

    // Assert
    expect(result1).toEqual({ essential: false, values: ['foo', 'bar'] })
    expect(result2).toEqual({ essential: false, values: [] })
  })
})
