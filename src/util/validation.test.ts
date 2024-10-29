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
  it('should validate a string claim successfully', () => {
    const input = createClaimInput({
      type: ClaimType.String,
      value: 'example',
      validation: { string: { minLength: 3, maxLength: 10 } },
    })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should validate a string claim successfully wihtout optional validation input', () => {
    const input = createClaimInput({
      type: ClaimType.String,
      value: 'example',
    })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error when the string is too short', () => {
    const input = createClaimInput({
      type: ClaimType.String,
      value: 'ex',
      validation: { string: { minLength: 3 } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should throw an error when the string is too long', () => {
    const input = createClaimInput({
      type: ClaimType.String,
      value: 'example12345',
      validation: { string: { maxLength: 10 } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate an int claim successfully', () => {
    const input = createClaimInput({
      type: ClaimType.Int,
      value: '50',
      validation: { int: { min: 0, max: 100 } },
    })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should validate an int claim successfully wihtout optional validation input', () => {
    const input = createClaimInput({
      type: ClaimType.Int,
      value: '50',
    })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error when the int is below the minimum', () => {
    const input = createClaimInput({
      type: ClaimType.Int,
      value: '-1',
      validation: { int: { min: 0 } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should throw an error when the int is above the maximum', () => {
    const input = createClaimInput({
      type: ClaimType.Int,
      value: '101',
      validation: { int: { max: 100 } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should throw an error when the int is not a valid number', () => {
    const input = createClaimInput({
      type: ClaimType.Int,
      value: 'abc',
      validation: { int: { min: 0, max: 100 } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate a float claim successfully', () => {
    const input = createClaimInput({
      type: ClaimType.Float,
      value: '50.5',
      validation: { float: { min: 0, max: 100 } },
    })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should validate a float claim successfully wihtout optional validation input', () => {
    const input = createClaimInput({
      type: ClaimType.Float,
      value: '50.5',
    })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error when the float is below the minimum', () => {
    const input = createClaimInput({
      type: ClaimType.Float,
      value: '-0.1',
      validation: { float: { min: 0 } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should throw an error when the float is above the maximum', () => {
    const input = createClaimInput({
      type: ClaimType.Float,
      value: '101.5',
      validation: { float: { max: 100 } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should throw an error when the float is not a valid number', () => {
    const input = createClaimInput({
      type: ClaimType.Float,
      value: 'abc',
      validation: { float: { min: 0, max: 100 } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate a list claim successfully', () => {
    const input = createClaimInput({
      type: ClaimType.List,
      value: 'Option1',
      validation: { list: { values: ['Option1', 'Option2', 'Option3'] } },
    })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error when the value is not in the list', () => {
    const input = createClaimInput({
      type: ClaimType.List,
      value: 'InvalidOption',
      validation: { list: { values: ['Option1', 'Option2', 'Option3'] } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate a regex claim successfully', () => {
    const input = createClaimInput({
      type: ClaimType.Regex,
      value: 'abc',
      validation: { regex: { pattern: '^[a-z]+$' } },
    })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error when the value does not match the regex pattern', () => {
    const input = createClaimInput({
      type: ClaimType.Regex,
      value: '123',
      validation: { regex: { pattern: '^[a-z]+$' } },
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should throw an error if list validation is missing for a list claim', () => {
    const input = createClaimInput({
      type: ClaimType.List,
      value: 'Option1',
      validation: undefined,
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should throw an error if regex validation is missing for a regex claim', () => {
    const input = createClaimInput({
      type: ClaimType.Regex,
      value: 'abc',
      validation: undefined,
    })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate a boolean claim successfully', () => {
    const input = createClaimInput({ type: ClaimType.Boolean, value: 'true' })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error for an invalid boolean claim', () => {
    const input = createClaimInput({ type: ClaimType.Boolean, value: 'yes' })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate a date claim successfully', () => {
    const input = createClaimInput({ type: ClaimType.Date, value: '2023-10-28' })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error for an invalid date claim', () => {
    const input = createClaimInput({ type: ClaimType.Date, value: '20231028' })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate a dateTime claim successfully', () => {
    const input = createClaimInput({ type: ClaimType.DateTime, value: '2023-10-28T15:45:00Z' })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error for an invalid dateTime claim', () => {
    const input = createClaimInput({ type: ClaimType.DateTime, value: '2023-10-28 15:45:00' })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate an email claim successfully', () => {
    const input = createClaimInput({ type: ClaimType.Email, value: 'test@example.com' })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error for an invalid email claim', () => {
    const input = createClaimInput({ type: ClaimType.Email, value: 'test@.com' })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate an image claim successfully', () => {
    const input = createClaimInput({ type: ClaimType.Image, value: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/' })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error for an invalid image claim', () => {
    const input = createClaimInput({ type: ClaimType.Image, value: 'invalid_image' })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate a phone claim successfully', () => {
    const input = createClaimInput({ type: ClaimType.Phone, value: '+1234567890' })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error for an invalid phone claim', () => {
    const input = createClaimInput({ type: ClaimType.Phone, value: '1234567890' })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })

  it('should validate a URL claim successfully', () => {
    const input = createClaimInput({ type: ClaimType.Url, value: 'https://example.com' })
    expect(() => validateClaimInput(input)).not.toThrow()
  })

  it('should throw an error for an invalid URL claim', () => {
    const input = createClaimInput({ type: ClaimType.Url, value: 'not_a_url' })
    expect(() => validateClaimInput(input)).toThrow(ValidationError)
  })
})
