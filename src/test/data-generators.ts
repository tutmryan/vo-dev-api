import type { Examples } from 'libphonenumber-js'
import { getExampleNumber } from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import type { CountryCode } from 'libphonenumber-js/types'
import { throwError } from '../util/throw-error'

export function randomElement<T>(elements: T[]): T {
  return elements[randomNumberBetween(0, elements.length - 1)] as T
}

export function randomNumberBetween(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randomPhoneNumber(): string {
  const countryPhoneCodes = Object.keys(examples as Examples) as CountryCode[]
  const randomCountryPhoneCode = randomElement(countryPhoneCodes)
  return getExampleNumber(randomCountryPhoneCode, examples)?.format('E.164') ?? throwError('Failed to generate random phone number')
}
