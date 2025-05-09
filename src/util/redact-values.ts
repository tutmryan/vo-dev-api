import { cloneDeep, forOwn, get, isNil, isObject, set } from 'lodash'

/**
 * Recursively replaces values in an object with '<redacted>' for the specified keys. Enumerates arrays and applies the same redaction to elements.
 * @param obj The object to redact
 * @param keys The keys to redact, that can be a dot-separated path (uses lodash's get/set)
 * Use dot notation to specify more specific keys.
 * Key checks are applied at every level of the object via recursion.
 * @returns A new object with the specified keys redacted
 */
export function redactValues(obj: any, ...keys: string[]) {
  return (function redact(current) {
    for (const k of keys) {
      if (!isNil(get(current, k))) set(current, k, '<redacted>')
    }
    forOwn(current, function (value) {
      if (isObject(value)) redact(value)
      else if (Array.isArray(value)) {
        for (const item of value) {
          if (isObject(item)) redact(item)
        }
      }
    })
    return current
  })(cloneDeep(obj))
}

/**
 * Recursively redacts sensitive values in an object.
 *
 * This function traverses the object and redacts values based on their keys. It uses a fuzzy matching approach to identify sensitive keys, such
 * as keys containing these values 'name', 'user', 'phone', 'address', 'secret', 'photo', 'biometric', 'birth', 'dob', 'age'.
 *
 * Note: This is designed to be used in logging and debugging scenarios where sensitive information should not be exposed.
 *
 * @param object The object to redact
 * @returns A new object with sensitive values redacted
 */
export function redactValueObjectUnknown(object: Record<string, unknown>) {
  const result: Record<string, string | object | undefined> = {}

  for (const key in object) {
    const value = object[key]

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        result[key] = value.map((item) => {
          if (typeof item === 'object') {
            if (Array.isArray(item)) return '<redacted-array>'
            return redactValueObjectUnknown(item as Record<string, unknown>)
          }
          return item
        })
      } else {
        result[key] = redactValueObjectUnknown(value as Record<string, unknown>)
      }
      continue
    }

    if (!value) continue

    const keyLower = key.toLowerCase()

    if (keyLower.includes('email')) {
      result[key] = redactValueEmail(value.toString())
    } else if (
      ['name', 'user', 'phone', 'address', 'secret', 'photo', 'biometric', 'birth', 'dob', 'age', 'nonce', 'state'].some((keyFragment) =>
        keyLower.includes(keyFragment),
      )
    ) {
      result[key] = redactValueInner(value.toString())
    } else {
      result[key] = value
    }
  }

  return result
}

export function redactValueInner(input: string | unknown) {
  if (!input || typeof input !== 'string') return undefined
  if (input.length < 8) return '<redacted>'
  return `${input.substring(0, 2)}*<redacted>*${input.substring(input.length - 2)}`
}

export function redactValueEmail(input: string | unknown) {
  if (!input || typeof input !== 'string') return undefined

  const atIndex = input.indexOf('@')
  if (atIndex === -1) return input
  const domain = input.substring(atIndex)

  if (input.length < 8) return `<redacted>${domain}`
  return `${input.charAt(0)}*<redacted>*${input.charAt(atIndex + 1)}${domain}`
}
