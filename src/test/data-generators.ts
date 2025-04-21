import type { Examples } from 'libphonenumber-js'
import { getExampleNumber } from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import type { CountryCode } from 'libphonenumber-js/types'
import { throwError } from '../util/throw-error'

function randomElement<T>(elements: T[]): T {
  return elements[randomNumberBetween(0, elements.length - 1)] as T
}

function randomNumberBetween(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * Generates a random phone number in E.164 compliant format.
 *
 * - This function randomly selects a country code from the available libphonenumber-js examples and generates a random phone number for that country.
 * - The generated phone number is formatted in E.164 format.
 *
 * @returns {string} A random phone number in E.164 format.
 *
 * @throws {Error} If the random phone number generation fails.
 */
export function randomPhoneNumber(): string {
  const countryPhoneCodes = Object.keys(examples as Examples) as CountryCode[]
  const randomCountryPhoneCode = randomElement(countryPhoneCodes)
  return getExampleNumber(randomCountryPhoneCode, examples)?.format('E.164') ?? throwError('Failed to generate random phone number')
}
