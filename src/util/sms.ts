import { isLocalDev } from '@makerx/node-common'
import type { Request } from 'express'
import parsePhoneNumberFromString from 'libphonenumber-js'
import twilio from 'twilio'
import z from 'zod'
import { localDev, sms } from '../config'
import { logger } from '../logger'
import { Lazy } from './lazy'

// 🚨🚨 Do not update this without updating the docs-site documentation and schema.graphql code docs 🚨🚨
// Set uses a hash table internally, so it's O(1) for lookups and not O(n) like an array
export const RESERVED_TEST_PHONE_NUMBERS = new Set([
  // AU https://www.acma.gov.au/phone-numbers-use-tv-shows-films-and-creative-works
  '+61491570006',
  '+61491570157',
  '+61491570737',
  '+61491573087',
  '+61491578957',
  // US https://www.nationalnanpa.com/pdf/NRUF/ATIS-0300115.pdf
  '+15005550119',
  '+15005550129',
  '+15005550139',
  '+15005550149',
  '+15005550159',
  // UK https://www.ofcom.org.uk/phones-and-broadband/phone-numbers/numbers-for-drama
  '+447709000018',
  '+447709000028',
  '+447709000038',
  '+447709000048',
  '+447709000058',
])

const client = Lazy(() => {
  return twilio(sms.sid, sms.secret, { accountSid: sms.accountSid })
})

export const smsPayloadSchema = z
  .object({
    From: z.string(),
    SmsSid: z.string(),
    SmsStatus: z.string(),
    MessageSid: z.string(),
    MessageStatus: z.union([
      z.literal('queued'),
      z.literal('sending'),
      z.literal('sent'),
      z.literal('failed'),
      z.literal('delivered'),
      z.literal('undelivered'),
      z.literal('receiving'),
      z.literal('received'),
      z.literal('accepted'),
      z.literal('scheduled'),
      z.literal('read'), // WhatsApp specific
      z.literal('canceled'),
    ]),
    ErrorCode: z.string().optional(),
  })
  .transform((data) => ({
    from: data.From,
    smsSid: data.SmsSid,
    smsStatus: data.SmsStatus,
    messageSid: data.MessageSid,
    messageStatus: data.MessageStatus,
    errorCode: data.ErrorCode,
  }))

export type MessageStatuses = z.infer<typeof smsPayloadSchema>['messageStatus']

export function toUserErrorMessage(messageStatus: MessageStatuses, errorCode?: string): string {
  if (errorCode === '30001') {
    logger.error('SMS sending failed: The message queue overflowed')
  }
  switch (errorCode) {
    case '30003':
      return 'SMS sending failed: Handset is unreachable'
    case '30004':
      return 'SMS sending failed: Message blocked'
    case '30005':
      return 'SMS sending failed: Handset destination is unknown'
    case '30006':
      return 'SMS sending failed: Landline or unreachable carrier'
    case '30007':
      return 'SMS sending failed: Message filtered'
  }
  switch (messageStatus) {
    case 'undelivered':
      return `SMS sending failed: Could not be delivered`
    case 'canceled':
      return `SMS sending failed: Sending was canceled`
  }
  return `SMS sending failed: Unknown error`
}

export const validateSmsCallbackRequest = (req: Request) => {
  return twilio.validateExpressRequest(req, sms.primaryToken)
}

const maskPhone = (phone: string) => phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4)

const getRegion = (to: string) => {
  const phoneNumber = parsePhoneNumberFromString(to)
  return phoneNumber?.country ?? 'AU'
}

export function sendSms(to: string, message: string, statusCallbackUrl?: string) {
  if (isLocalDev) {
    if (!localDev) {
      logger.warn('Local dev is detected but no local dev config is provided. No sms will be sent until this is fixed.')
      return
    }
    if (localDev.sms.disabled) {
      logger.debug('SMS sending is disabled by the local dev config')
      return
    }
    if (localDev.sms.allowList.length && !localDev.sms.allowList.includes(to)) {
      logger.warn(`Blocked sending sms to ${maskPhone(to)}`)
      return
    }
  }

  if (RESERVED_TEST_PHONE_NUMBERS.has(to)) {
    logger.warn(`Blocked sending sms to ${maskPhone(to)} as it is a reserved number for testing`)
    return
  }

  const toRegion = getRegion(to)
  const from = sms.from[toRegion] ?? sms.from['AU']

  return client().messages.create({
    body: message,
    from,
    to,
    statusCallback: statusCallbackUrl,
  })
}
