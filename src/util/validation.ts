import validator from 'validator'
import { z } from 'zod'
import { convertToClaimValidation } from '../features/contracts/mapping'
import type {
  ContractDisplayClaim,
  ContractDisplayClaimInput,
  ListValidation,
  NumberValidation,
  RegexValidation,
  TextValidation,
} from '../generated/graphql'

export const MAX_PRECISION = 10

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

const baseTextSchema = z.string()
const baseNumberSchema = z.coerce.number()
const booleanSchema = z.enum(['true', 'false'])
const dateSchema = z.string().date('Invalid date format. Expected YYYY-MM-DD.')
const dateTimeSchema = z.string().datetime('Invalid date-time format. Expected YYYY-MM-DDTHH:MM:SSZ.')
const emailSchema = z.string().email({ message: 'Invalid email address.' })
const imageSchema = z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, { message: 'Invalid base64 jpeg data URL.' })
const phoneSchema = z.string().refine((value) => validator.isMobilePhone(value, 'any', { strictMode: true }), {
  message: 'Invalid international E.164 format phone number.',
})
const urlSchema = z.string().url({ message: 'Invalid URL.' })

const isValidNumber = (value: number | null | undefined): value is number => {
  return value !== null && value !== undefined
}

const textSchema = (validation?: TextValidation) => {
  let schema = baseTextSchema
  if (isValidNumber(validation?.minLength)) {
    schema = schema.min(validation.minLength, `Minimum length is ${validation.minLength}`)
  }
  if (isValidNumber(validation?.maxLength)) {
    schema = schema.max(validation.maxLength, `Maximum length is ${validation.maxLength}`)
  }
  return schema
}

const numberSchema = (validation?: NumberValidation) => {
  let schema = baseNumberSchema

  if (isValidNumber(validation?.min)) {
    schema = schema.min(validation.min, `Minimum value is ${validation.min}`)
  }

  if (isValidNumber(validation?.max)) {
    schema = schema.max(validation.max, `Maximum value is ${validation.max}`)
  }

  if (isValidNumber(validation?.precision)) {
    return schema.refine(
      (val) => {
        const decimalPlaces = val.toString().split('.')[1]?.length || 0
        return decimalPlaces <= validation.precision!
      },
      { message: `Maximum precision is ${validation.precision} decimal places` },
    )
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
  switch (type) {
    case 'regex':
      if (!validation?.regex || !validation.regex.pattern) {
        throw new ValidationError('Regex type requires a "pattern" in validation.')
      }
      try {
        new RegExp(validation.regex.pattern)
      } catch (e) {
        throw new ValidationError(`Invalid regex pattern: "${validation.regex.pattern}".`)
      }
      break

    case 'list':
      if (!validation?.list || validation.list.values.length === 0) {
        throw new ValidationError('List type requires a non-empty "values" array in validation.')
      }
      break

    case 'text':
      if (validation?.text) {
        const { minLength, maxLength } = validation.text

        if (isValidNumber(minLength) && minLength < 0) {
          throw new ValidationError('Text validation "minLength" must be greater than or equal to 0.')
        }

        if (isValidNumber(maxLength) && maxLength < 0) {
          throw new ValidationError('Text validation "maxLength" must be greater than or equal to 0.')
        }

        if (isValidNumber(minLength) && isValidNumber(maxLength) && maxLength < minLength) {
          throw new ValidationError('Text validation "maxLength" must be greater than or equal to "minLength".')
        }
      }
      break

    case 'number':
      if (validation?.number) {
        const { min, max, precision } = validation.number
        if (isValidNumber(min) && isValidNumber(max) && max < min) {
          throw new ValidationError('Number validation "max" must be greater than or equal to "min".')
        }
        if (isValidNumber(precision)) {
          if (precision > MAX_PRECISION) {
            throw new ValidationError(`Number validation "precision" must not exceed ${MAX_PRECISION} decimal places.`)
          }
          if (precision < 0) {
            throw new ValidationError('Number validation "precision" must be greater than or equal to 0.')
          }
        }
      }
      break

    default:
      break
  }
}

export function validateClaimValue(type: string, value: unknown, validation?: ContractDisplayClaim['validation']) {
  let schema

  switch (type) {
    case 'text':
      schema = textSchema(validation as TextValidation)
      break
    case 'number':
      schema = numberSchema(validation as NumberValidation)
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

  const result = schema.safeParse(value)
  if (!result.success) {
    const errorMessage = result.error.errors.map((err) => `[Claim Type: ${type}] ${err.message}`).join(', ')
    throw new ValidationError(errorMessage)
  }
}

export function validateClaimInput(claimInput: ContractDisplayClaimInput) {
  const { type, value, validation, isFixed } = claimInput

  if (isFixed && !value) {
    throw new ValidationError(`Fixed claims must have a defined value. Missing value for claim of type "${type}".`)
  }

  validateClaimRules(type, validation)

  // Skip value validation for claim inputs if `value` is not provided (e.g., it will be set during issuance)
  if (value) {
    validateClaimValue(type, value, convertToClaimValidation(validation))
  }
}
/**
 * Validates an email address using the ZOD emailSchema
 */
export const isValidEmail = (email: string) => {
  const result = emailSchema.safeParse(email)
  return result.success
}
