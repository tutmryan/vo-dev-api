import { cloneDeep, forOwn, get, isNil, isObject, set } from 'lodash'
import { StandardClaims } from '../features/contracts/claims'
import type { RequestCredential } from '../generated/graphql'
import { logger } from '../logger'

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
        if (['amr'].includes(key)) {
          result[key] = value
          continue
        }

        result[key] = value.map((item) => {
          if (typeof item === 'object') {
            if (Array.isArray(item)) return '<redacted-array>'
            return redactValueObjectUnknown(item as Record<string, unknown>)
          }
          return redactValueInner(item.toString())
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
      [
        'name',
        'user',
        'phone',
        'address',
        'secret',
        'photo',
        'biometric',
        'birth',
        'dob',
        'age',
        'nonce',
        'state',
        'ssn',
        'tfn',
        // Remove PII from presentation request logging
        'values',
        'sub',
        's_hash',
      ].some((keyFragment) => keyLower.includes(keyFragment)) &&
      !['claimName'].includes(key)
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
  if (input.length < 12) return `${input.substring(0, 2)}*<redacted>*${input.substring(input.length - 2)}`
  return `${input.substring(0, 4)}*<redacted>*${input.substring(input.length - 4)}`
}

export function redactValueEmail(input: string | unknown) {
  if (!input || typeof input !== 'string') return undefined

  const atIndex = input.indexOf('@')
  if (atIndex === -1) return input
  const domain = input.substring(atIndex)

  if (input.length < 8) return `<redacted>${domain}`
  return `${input.charAt(0)}*<redacted>*${input.charAt(atIndex + 1)}${domain}`
}

export const safeClaimNames = new Set([StandardClaims.identityId, StandardClaims.issuanceId])

export const redactConstraints = (requestCredentials: RequestCredential[]): RequestCredential[] => {
  return requestCredentials.map((reqCred) => {
    if (!reqCred.constraints) return reqCred

    const redactedConstraints = reqCred.constraints.map((c) => {
      const isSafe = safeClaimNames.has(c.claimName as StandardClaims)
      if (c.values) {
        return { claimName: c.claimName, values: isSafe ? c.values : null }
      }
      if (c.startsWith) {
        return { claimName: c.claimName, startsWith: isSafe ? c.startsWith : null }
      }
      if (c.contains) {
        return { claimName: c.claimName, contains: isSafe ? c.contains : null }
      }
      return { claimName: c.claimName }
    })

    return { ...reqCred, constraints: redactedConstraints }
  })
}

export function redactPresentationReceipt(receipt: unknown): string | null {
  if (!receipt || typeof receipt !== 'object' || !('id_token' in receipt) || typeof receipt.id_token !== 'string') {
    logger.error('Failed to redact presentation receipt: missing or invalid id_token')
    return null
  }
  const id_token = receipt.id_token
  let faceCheck: string | null = null
  if ('faceCheck' in receipt) {
    if (typeof receipt.faceCheck !== 'string') {
      logger.error('Unexpected faceCheck type in receipt, expected string')
    } else {
      faceCheck = receipt.faceCheck
    }
  }
  return JSON.stringify({
    id_token,
    faceCheck,
  })
}
