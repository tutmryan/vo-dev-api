import { z } from 'zod'
import { convertToClaimValidation } from '../features/contracts/mapping'
import type {
  ContractDisplayClaim,
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

const baseStringSchema = z.string()
const baseIntSchema = z.number().int()
const baseFloatSchema = z.number()
const booleanSchema = z.enum(['true', 'false'])
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format. Expected YYYY-MM-DD.' })
const dateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, { message: 'Invalid date-time format. Expected YYYY-MM-DDTHH:MM:SSZ.' })
const emailSchema = z.string().email({ message: 'Invalid email address.' })
const imageSchema = z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, { message: 'Invalid base64 image.' })
const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, { message: 'Invalid E.164 phone number.' })
const urlSchema = z.string().url({ message: 'Invalid URL.' })

const isValidNumber = (value: number | null | undefined): value is number => {
  return value !== null && value !== undefined
}

const stringSchema = (validation?: StringValidation) => {
  let schema = baseStringSchema
  if (isValidNumber(validation?.minLength)) {
    schema = schema.min(validation.minLength, `Minimum length is ${validation.minLength}`)
  }
  if (isValidNumber(validation?.maxLength)) {
    schema = schema.max(validation.maxLength, `Maximum length is ${validation.maxLength}`)
  }
  return schema
}

const intSchema = (validation?: IntValidation) => {
  let schema = baseIntSchema
  if (isValidNumber(validation?.min)) {
    schema = schema.min(validation.min, `Minimum value is ${validation.min}`)
  }
  if (isValidNumber(validation?.max)) {
    schema = schema.max(validation.max, `Maximum value is ${validation.max}`)
  }
  return schema
}

const floatSchema = (validation?: FloatValidation) => {
  let schema = baseFloatSchema
  if (isValidNumber(validation?.min)) {
    schema = schema.min(validation.min, `Minimum value is ${validation.min}`)
  }
  if (isValidNumber(validation?.max)) {
    schema = schema.max(validation.max, `Maximum value is ${validation.max}`)
  }
  return schema
}

const listSchema = (validation: ListValidation) => {
  return z.enum(validation.values as [string, ...string[]], {
    message: `Value must be one of: ${validation.values.join(', ')}`,
  })
}

const regexSchema = (validation: RegexValidation) => {
  return z.string().regex(new RegExp(validation.pattern), { message: 'Value does not match the required pattern.' })
}

function validateClaimRules(type: string, validation?: ContractDisplayClaimInput['validation']) {
  if (type === 'regex' && (!validation?.regex || !validation.regex.pattern)) {
    throw new ValidationError('Regex type requires a "pattern" in validation.')
  }
  if (type === 'list' && (!validation?.list || validation.list.values.length === 0)) {
    throw new ValidationError('List type requires a non-empty "values" array in validation.')
  }
}

export function validateClaimValue(type: string, value: string, validation?: ContractDisplayClaim['validation']) {
  let schema
  let parsedValue: any = value

  switch (type) {
    case 'string':
      schema = stringSchema(validation as StringValidation)
      break
    case 'int':
      parsedValue = parseInt(value, 10)
      if (isNaN(parsedValue)) {
        throw new ValidationError('Value must be a valid integer.')
      }
      schema = intSchema(validation as IntValidation)
      break
    case 'float':
      parsedValue = parseFloat(value)
      if (isNaN(parsedValue)) {
        throw new ValidationError('Value must be a valid float.')
      }
      schema = floatSchema(validation as FloatValidation)
      break
    case 'list':
      schema = listSchema(validation as ListValidation)
      break
    case 'regex':
      schema = regexSchema(validation as RegexValidation)
      break
    case 'boolean':
      schema = booleanSchema
      break
    case 'date':
      schema = dateSchema
      break
    case 'dateTime':
      schema = dateTimeSchema
      break
    case 'email':
      schema = emailSchema
      break
    case 'image':
      schema = imageSchema
      break
    case 'phone':
      schema = phoneSchema
      break
    case 'url':
      schema = urlSchema
      break
    default:
      throw new ValidationError(`Unsupported claim type: ${type}`)
  }

  const result = schema.safeParse(parsedValue)
  if (!result.success) {
    throw new ValidationError(result.error.errors.map((err) => err.message).join(', '))
  }
}

export function validateClaimInput(claimInput: ContractDisplayClaimInput) {
  const { type, value, validation } = claimInput
  validateClaimRules(type, validation)

  // Skip value validation for claim inputs if `value` is not provided (e.g., it will be set during consumption)
  if (!value) return

  validateClaimValue(type, value, convertToClaimValidation(validation))
}

// use the ZOD regex: https://github.com/colinhacks/zod/blob/main/deno/lib/types.ts
// eslint-disable-next-line no-useless-escape
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i

/**
 * Validates an email address using the ZOD regex
 */
export const isValidEmail = (email: string) => emailRegex.test(email)
