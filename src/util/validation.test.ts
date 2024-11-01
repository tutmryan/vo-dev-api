import { ClaimType, ContractDisplayClaimInput } from '../generated/graphql'
import { validateClaimInput, ValidationError } from './validation'

function createClaimInput(overrides: Partial<ContractDisplayClaimInput>): ContractDisplayClaimInput {
  return {
    claim: 'default_claim',
    label: 'Default Claim',
    type: ClaimType.String,
    value: undefined,
    validation: undefined,
    ...overrides,
  }
}

describe('validateClaimInput', () => {
  describe('when predefined value is missing', () => {
    it.each([
      { type: ClaimType.String, value: undefined, description: 'does not throw for string claim' },
      { type: ClaimType.Int, value: undefined, description: 'does not throw for int claim' },
      { type: ClaimType.Float, value: undefined, description: 'does not throw for float claim' },
      { type: ClaimType.Boolean, value: undefined, description: 'does not throw for boolean claim' },
      { type: ClaimType.Date, value: undefined, description: 'does not throw for date claim' },
      { type: ClaimType.DateTime, value: undefined, description: 'does not throw for dateTime claim' },
      { type: ClaimType.Email, value: undefined, description: 'does not throw for email claim' },
      { type: ClaimType.Image, value: undefined, description: 'does not throw for image claim' },
      { type: ClaimType.Phone, value: undefined, description: 'does not throw for phone claim' },
      { type: ClaimType.Url, value: undefined, description: 'does not throw for url claim' },
      {
        type: ClaimType.Regex,
        value: undefined,
        validation: { regex: { pattern: '^.*$' } },
        description: 'does not throw for regex claim with validation',
      },
      {
        type: ClaimType.List,
        value: undefined,
        validation: { list: { values: ['Option1'] } },
        description: 'does not throw for list claim with validation',
      },
    ])('$description', ({ type, value, validation }) => {
      const input = createClaimInput({ type, value, validation })
      expect(() => validateClaimInput(input)).not.toThrow()
    })
  })

  describe('String claim', () => {
    it.each([
      { type: 'validates successfully', value: 'example', validation: { string: { minLength: 3, maxLength: 10 } } },
      { type: 'validates successfully without optional validation', value: 'example' },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.String, value, validation })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it.each([
      { type: 'throws when the string is too short', value: 'ex', validation: { string: { minLength: 3 } } },
      { type: 'throws when the string is too long', value: 'example12345', validation: { string: { maxLength: 10 } } },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.String, value, validation })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Integer claim', () => {
    it.each([
      { type: 'validates successfully', value: '50', validation: { int: { min: 0, max: 100 } } },
      { type: 'validates without optional validation', value: '50' },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Int, value, validation })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it.each([
      { type: 'throws when int is below minimum', value: '-1', validation: { int: { min: 0 } } },
      { type: 'throws when int is above maximum', value: '101', validation: { int: { max: 100 } } },
      { type: 'throws when int is not a valid number', value: 'abc', validation: { int: { min: 0, max: 100 } } },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Int, value, validation })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Float claim', () => {
    it.each([
      { type: 'validates successfully', value: '50.5', validation: { float: { min: 0, max: 100 } } },
      { type: 'validates without optional validation', value: '50.5' },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Float, value, validation })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it.each([
      { type: 'throws when float is below minimum', value: '-0.1', validation: { float: { min: 0 } } },
      { type: 'throws when float is above maximum', value: '101.5', validation: { float: { max: 100 } } },
      { type: 'throws when float is not a valid number', value: 'abc', validation: { float: { min: 0, max: 100 } } },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Float, value, validation })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('List claim', () => {
    it.each([{ type: 'validates successfully', value: 'Option1', validation: { list: { values: ['Option1', 'Option2'] } } }])(
      '$type',
      ({ value, validation }) => {
        const input = createClaimInput({ type: ClaimType.List, value, validation })
        expect(() => validateClaimInput(input)).not.toThrow()
      },
    )

    it.each([
      { type: 'throws when value is not in the list', value: 'InvalidOption', validation: { list: { values: ['Option1', 'Option2'] } } },
      { type: 'throws when validation rules are missing', value: undefined, validation: undefined },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.List, value, validation })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Regex claim', () => {
    it.each([{ type: 'validates successfully', value: 'abc', validation: { regex: { pattern: '^[a-z]+$' } } }])(
      '$type',
      ({ value, validation }) => {
        const input = createClaimInput({ type: ClaimType.Regex, value, validation })
        expect(() => validateClaimInput(input)).not.toThrow()
      },
    )

    it.each([
      { type: 'throws when validation rules are missing', value: undefined, validation: undefined },
      { type: 'throws when value does not match pattern', value: '123', validation: { regex: { pattern: '^[a-z]+$' } } },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Regex, value, validation })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Boolean claim', () => {
    it.each([
      { type: 'validates true value', value: 'true' },
      { type: 'validates false value', value: 'false' },
    ])('$type', ({ value }) => {
      const input = createClaimInput({ type: ClaimType.Boolean, value })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for an invalid boolean value', () => {
      const input = createClaimInput({ type: ClaimType.Boolean, value: 'yes' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Date claim', () => {
    it.each([{ type: 'validates date format', value: '2023-10-28' }])('$type', ({ value }) => {
      const input = createClaimInput({ type: ClaimType.Date, value })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid date format', () => {
      const input = createClaimInput({ type: ClaimType.Date, value: '20231028' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('DateTime claim', () => {
    it.each([{ type: 'validates correct date-time format', value: '2023-10-28T15:45:00Z' }])('$type', ({ value }) => {
      const input = createClaimInput({ type: ClaimType.DateTime, value })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid date-time format', () => {
      const input = createClaimInput({ type: ClaimType.DateTime, value: '2023-10-28 15:45:00' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Email claim', () => {
    it.each([{ type: 'validates correct email format', value: 'test@example.com' }])('$type', ({ value }) => {
      const input = createClaimInput({ type: ClaimType.Email, value })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid email format', () => {
      const input = createClaimInput({ type: ClaimType.Email, value: 'test@.com' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Image claim', () => {
    it.each([{ type: 'validates base64 image format', value: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/' }])(
      '$type',
      ({ value }) => {
        const input = createClaimInput({ type: ClaimType.Image, value })
        expect(() => validateClaimInput(input)).not.toThrow()
      },
    )

    it('throws an error for invalid image format', () => {
      const input = createClaimInput({ type: ClaimType.Image, value: 'invalid_image' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Phone claim', () => {
    it.each([{ type: 'validates correct phone format', value: '+1234567890' }])('$type', ({ value }) => {
      const input = createClaimInput({ type: ClaimType.Phone, value })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid phone format', () => {
      const input = createClaimInput({ type: ClaimType.Phone, value: '1234567890' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('URL claim', () => {
    it.each([{ type: 'validates correct URL format', value: 'https://example.com' }])('$type', ({ value }) => {
      const input = createClaimInput({ type: ClaimType.Url, value })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid URL format', () => {
      const input = createClaimInput({ type: ClaimType.Url, value: 'not_a_url' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })
})
