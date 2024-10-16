import { isLocalDev } from '@makerx/node-common'
import twilio from 'twilio'
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
  '+447700900018',
  '+447700900028',
  '+447700900038',
  '+447700900048',
  '+447700900058',
])

const client = Lazy(() => {
  return twilio(sms.sid, sms.secret, { accountSid: sms.accountSid })
})

const maskPhone = (phone: string) => phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4)

export function sendSms(to: string, message: string) {
  if (isLocalDev) {
    if (!localDev) {
      logger.warn('Local dev is detected but no local dev config is provided. No sms will be sent until this is fixed.')
      return
    }
    if (localDev.email.disabled) {
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

  return client().messages.create({
    body: message,
    from: sms.from,
    to,
  })
}
