import { addDays } from 'date-fns'
import { AsyncIssuanceRequestExpiry } from '../../generated/graphql'
import { completeAsyncIssuance } from './handlers/complete-async-issuance'

export type ExpiryPeriodsInDays = 1 | 3 | 7 | 14 | 30 | 90

type capitalizeObjectProperties<T> = {
  [K in keyof T as Uncapitalize<string & K>]: T[K]
}

type AsyncIssuanceRequestExpiryMapToExpiryPeriodsInDays = capitalizeObjectProperties<{
  [K in keyof typeof AsyncIssuanceRequestExpiry]: ExpiryPeriodsInDays
}>

const asyncIssuanceRequestExpiryMapToExpiryPeriodsInDays: AsyncIssuanceRequestExpiryMapToExpiryPeriodsInDays = {
  oneDay: 1,
  threeDays: 3,
  oneWeek: 7,
  twoWeeks: 14,
  oneMonth: 30,
  threeMonths: 90,
}

export const convertAsyncIssuanceRequestExpiryToDays = (expiry: AsyncIssuanceRequestExpiry): ExpiryPeriodsInDays => {
  return asyncIssuanceRequestExpiryMapToExpiryPeriodsInDays[expiry]
}

const expiryDaysToExpiryMap: Record<ExpiryPeriodsInDays, AsyncIssuanceRequestExpiry> = {
  1: AsyncIssuanceRequestExpiry.OneDay,
  3: AsyncIssuanceRequestExpiry.ThreeDays,
  7: AsyncIssuanceRequestExpiry.OneWeek,
  14: AsyncIssuanceRequestExpiry.TwoWeeks,
  30: AsyncIssuanceRequestExpiry.OneMonth,
  90: AsyncIssuanceRequestExpiry.ThreeMonths,
}

export const convertAsyncIssuanceExpiryDaysToRequestExpiry = (days: ExpiryPeriodsInDays): AsyncIssuanceRequestExpiry => {
  if (!Object.keys(expiryDaysToExpiryMap).includes(days.toString())) throw new Error(`Unexpected expiry period in days: ${days}`)
  return expiryDaysToExpiryMap[days]
}

export const calculateExpiryFromNow = (expiry: ExpiryPeriodsInDays | AsyncIssuanceRequestExpiry) => {
  const expiryPeriodInDays = typeof expiry === 'string' ? convertAsyncIssuanceRequestExpiryToDays(expiry) : expiry
  return addDays(new Date(), expiryPeriodInDays)
}

export { completeAsyncIssuance }
