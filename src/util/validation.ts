import type {
  ContractDisplayClaimInput,
  FloatValidation,
  IntValidation,
  ListValidation,
  RegexValidation,
  StringValidation,
} from '../generated/graphql'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateClaimInput(claimInput: ContractDisplayClaimInput) {
  const { type, value, validation } = claimInput

  switch (type) {
    case 'string':
      validateString(value, validation?.string)
      break
    case 'int':
      validateInt(value, validation?.int)
      break
    case 'float':
      validateFloat(value, validation?.float)
      break
    case 'list':
      validateList(value, validation?.list)
      break
    case 'regex':
      validateRegex(value, validation?.regex)
      break
    case 'boolean':
      validateBoolean(value)
      break
    case 'date':
      validateDate(value)
      break
    case 'dateTime':
      validateDateTime(value)
      break
    case 'email':
      validateEmail(value)
      break
    case 'image':
      validateImage(value)
      break
    case 'phone':
      validatePhone(value)
      break
    case 'url':
      validateUrl(value)
      break
    default:
      throw new ValidationError(`Unsupported claim type: ${type}`)
  }
}

function isValidValue<T>(value: T | null | undefined): value is T {
  return value != null
}

function validateString(value?: string | null, validation?: StringValidation) {
  if (!isValidValue(value)) return
  if (validation?.minLength != null && value.length < validation.minLength) {
    throw new ValidationError(`String is too short, minimum length is ${validation.minLength}`)
  }
  if (validation?.maxLength != null && value.length > validation.maxLength) {
    throw new ValidationError(`String is too long, maximum length is ${validation.maxLength}`)
  }
}

function validateInt(value?: string | null, validation?: IntValidation) {
  if (!isValidValue(value)) return
  const parsedValue = parseInt(value, 10)
  if (!Number.isInteger(parsedValue)) {
    throw new ValidationError('Value must be an integer.')
  }
  if (validation?.min != null && parsedValue < validation.min) {
    throw new ValidationError(`Integer is too small, minimum is ${validation.min}`)
  }
  if (validation?.max != null && parsedValue > validation.max) {
    throw new ValidationError(`Integer is too large, maximum is ${validation.max}`)
  }
}

function validateFloat(value?: string | null, validation?: FloatValidation) {
  if (!isValidValue(value)) return
  const parsedValue = parseFloat(value)
  if (isNaN(parsedValue) || typeof parsedValue !== 'number') {
    throw new ValidationError('Value must be a float.')
  }
  if (validation?.min != null && parsedValue < validation.min) {
    throw new ValidationError(`Float is too small, minimum is ${validation.min}`)
  }
  if (validation?.max != null && parsedValue > validation.max) {
    throw new ValidationError(`Float is too large, maximum is ${validation.max}`)
  }
}

function validateList(value?: string | null, validation?: ListValidation) {
  if (!validation) {
    throw new ValidationError('List validation is required for list claim type.')
  }
  if (!isValidValue(value)) return
  if (!validation.values.includes(value)) {
    throw new ValidationError(`Value must be one of: ${validation.values.join(', ')}`)
  }
}

function validateRegex(value?: string | null, validation?: RegexValidation) {
  if (!validation) {
    throw new ValidationError('Regex validation is required for regex claim type.')
  }
  if (!isValidValue(value)) return
  const regex = new RegExp(validation.pattern)
  if (!regex.test(value)) {
    throw new ValidationError(`Value does not match the pattern: ${validation.pattern}`)
  }
}

function validateBoolean(value?: string | null) {
  if (!isValidValue(value)) return
  if (value !== 'true' && value !== 'false') {
    throw new ValidationError('Value must be "true" or "false".')
  }
}

function validateDate(value?: string | null) {
  if (!isValidValue(value)) return
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(value)) {
    throw new ValidationError('Value must be in full-date ISO 8601 format (YYYY-MM-DD).')
  }
}

function validateDateTime(value?: string | null) {
  if (!isValidValue(value)) return
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
  if (!dateTimeRegex.test(value)) {
    throw new ValidationError('Value must be in ISO 8601 date-time format (YYYY-MM-DDTHH:MM:SSZ).')
  }
}

function validateEmail(value?: string | null) {
  if (!isValidValue(value)) return
  if (!emailRegex.test(value)) {
    throw new ValidationError('Value must be a valid email address.')
  }
}

function validateImage(value?: string | null) {
  if (!isValidValue(value)) return
  const imageRegex = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/
  if (!imageRegex.test(value)) {
    throw new ValidationError('Value must be a valid base64-encoded JPEG image.')
  }
}

function validatePhone(value?: string | null) {
  if (!isValidValue(value)) return
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  if (!phoneRegex.test(value)) {
    throw new ValidationError('Value must be a valid phone number in E.164 format.')
  }
}

function validateUrl(value?: string | null) {
  if (!isValidValue(value)) return
  try {
    new URL(value)
  } catch {
    throw new ValidationError('Value must be a valid URL.')
  }
}
// use the ZOD regex: https://github.com/colinhacks/zod/blob/main/deno/lib/types.ts
// eslint-disable-next-line no-useless-escape
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i

/**
 * Validates an email address using the ZOD regex
 */
export const isValidEmail = (email: string) => emailRegex.test(email)
