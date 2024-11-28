import { ClaimType, ContractDisplayClaimInput } from '../generated/graphql'
import { MAX_PRECISION, validateClaimInput, ValidationError } from './validation'

function createClaimInput(overrides: Partial<ContractDisplayClaimInput>): ContractDisplayClaimInput {
  return {
    claim: 'default_claim',
    label: 'Default Claim',
    type: ClaimType.Text,
    isFixed: false,
    isOptional: false,
    value: undefined,
    validation: undefined,
    ...overrides,
  }
}

describe('validateClaimInput', () => {
  describe('when isFixed is true, a valid value is required', () => {
    it.each([
      { type: ClaimType.Text, value: undefined, isFixed: true, description: 'throws for text claim' },
      { type: ClaimType.Number, value: undefined, isFixed: true, description: 'throws for number claim' },
      { type: ClaimType.Boolean, value: undefined, isFixed: true, description: 'throws for boolean claim' },
      { type: ClaimType.Date, value: undefined, isFixed: true, description: 'throws for date claim' },
      { type: ClaimType.DateTime, value: undefined, isFixed: true, description: 'throws for dateTime claim' },
      { type: ClaimType.Email, value: undefined, isFixed: true, description: 'throws for email claim' },
      { type: ClaimType.Image, value: undefined, isFixed: true, description: 'throws for image claim' },
      { type: ClaimType.Phone, value: undefined, isFixed: true, description: 'throws for phone claim' },
      { type: ClaimType.Url, value: undefined, isFixed: true, description: 'throws for url claim' },
      {
        type: ClaimType.Regex,
        value: undefined,
        validation: { regex: { pattern: '^.*$' } },
        isFixed: true,
        description: 'throws for regex claim with validation',
      },
      {
        type: ClaimType.List,
        value: undefined,
        validation: { list: { values: ['Option1', 'Option2'] } },
        isFixed: true,
        description: 'throws throw for list claim with validation',
      },
    ])('$description', ({ type, value, validation, isFixed }) => {
      const input = createClaimInput({ type, value, validation, isFixed })
      expect(() => validateClaimInput(input)).toThrow()
    })
  })

  describe('Text claim', () => {
    it.each([
      { type: 'validates successfully', value: 'example', validation: { text: { minLength: 3, maxLength: 10 } } },
      { type: 'validates successfully without optional validation', value: 'example' },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Text, value, validation })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it.each([
      { type: 'throws when the text is too short', value: 'ex', validation: { text: { minLength: 3 } } },
      { type: 'throws when the text is too long', value: 'example12345', validation: { text: { maxLength: 10 } } },
      {
        type: 'throws when validation minLength is negative',
        value: undefined,
        validation: { text: { minLength: -1 } },
      },

      {
        type: 'throws when validation maxLength is negative',
        value: undefined,
        validation: { text: { maxLength: -1 } },
      },
      {
        type: 'throws when validation maxLength is less than minLength',
        value: undefined,
        validation: { text: { minLength: 10, maxLength: 5 } },
      },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Text, value, validation })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Number claim', () => {
    it.each([
      { type: 'validates successfully with integer', value: '50', validation: { number: { min: 0, max: 100 } } },
      { type: 'validates successfully with decimal', value: '50.5', validation: { number: { min: 0, max: 100 } } },
      { type: 'validates without optional validation (integer)', value: '50' },
      { type: 'validates without optional validation (decimal)', value: '50.5' },
      { type: 'validates successfully with precision', value: '12.34', validation: { number: { precision: 2 } } },
      { type: 'validates successfully with precision again', value: '12.345', validation: { number: { precision: 3 } } },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Number, value, validation })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it.each([
      { type: 'throws when value is not a valid number (letters)', value: 'abc' },
      { type: 'throws when value is not a valid number (symbols)', value: '$%^' },
      { type: 'throws when number is below minimum', value: '-1', validation: { number: { min: 0 } } },
      { type: 'throws when number is above maximum', value: '101', validation: { number: { max: 100 } } },
      {
        type: 'throws when number has too many decimal places',
        value: '12.345',
        validation: { number: { min: undefined, max: undefined, precision: 2 } },
      },
      {
        type: 'throws when validation max is less than min',
        value: undefined,
        validation: { number: { min: 10, max: 5 } },
      },
      {
        type: 'throws when precision is above MAX_PRECISION',
        value: undefined,
        validation: { number: { min: undefined, max: undefined, precision: MAX_PRECISION + 1 } },
      },
      {
        type: 'throws when precision is negative',
        value: undefined,
        validation: { number: { min: undefined, max: undefined, precision: -1 } },
      },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.Number, value, validation })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('List claim', () => {
    it('validates successfully', () => {
      const input = createClaimInput({
        type: ClaimType.List,
        value: 'Option1',
        validation: { list: { values: ['Option1', 'Option2'] } },
      })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it.each([
      { type: 'throws when value is not in the list', value: 'InvalidOption', validation: { list: { values: ['Option1', 'Option2'] } } },
      { type: 'throws when validation rules are missing', value: undefined, validation: undefined },
    ])('$type', ({ value, validation }) => {
      const input = createClaimInput({ type: ClaimType.List, value, validation })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Regex claim', () => {
    it('validates successfully', () => {
      const input = createClaimInput({
        type: ClaimType.Regex,
        value: 'abc',
        validation: { regex: { pattern: '^[a-z]+$' } },
      })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it.each([
      { type: 'throws when validation rules are missing', value: undefined, validation: undefined },
      { type: 'throws when pattern is invalid', value: undefined, validation: { regex: { pattern: '[a-z-' } } },
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
    it('validates date format', () => {
      const input = createClaimInput({ type: ClaimType.Date, value: '2023-10-28' })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid date format', () => {
      const input = createClaimInput({ type: ClaimType.Date, value: '20231028' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('DateTime claim', () => {
    it.each([
      { type: 'validates ISO8601 date-time without milliseconds', value: '2023-10-28T15:45:00Z' },
      { type: 'validates ISO8601 date-time with milliseconds', value: '2024-11-18T17:00:00.000Z' },
    ])('$type', ({ value }) => {
      const input = createClaimInput({ type: ClaimType.DateTime, value })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for an invalid date-time format', () => {
      const input = createClaimInput({ type: ClaimType.DateTime, value: '2023-10-28 15:45:00' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Email claim', () => {
    it('validates correct email format', () => {
      const input = createClaimInput({ type: ClaimType.Email, value: 'test@example.com' })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid email format', () => {
      const input = createClaimInput({ type: ClaimType.Email, value: 'test@.com' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Image claim', () => {
    it('validates base64 image format', () => {
      const input = createClaimInput({ type: ClaimType.Image, value: 'data:image/jpeg;base64,ZmFjZS1jaGVjay0xMjM=' })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid image format', () => {
      const input = createClaimInput({ type: ClaimType.Image, value: 'invalid_image' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('Phone claim', () => {
    it('validates correct phone format', () => {
      const input = createClaimInput({ type: ClaimType.Phone, value: '+61412345678' })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid phone format', () => {
      const input = createClaimInput({ type: ClaimType.Phone, value: '1234567890' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })

  describe('URL claim', () => {
    it('validates correct URL format', () => {
      const input = createClaimInput({ type: ClaimType.Url, value: 'https://example.com' })
      expect(() => validateClaimInput(input)).not.toThrow()
    })

    it('throws an error for invalid URL format', () => {
      const input = createClaimInput({ type: ClaimType.Url, value: 'not_a_url' })
      expect(() => validateClaimInput(input)).toThrow(ValidationError)
    })
  })
})
