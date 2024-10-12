import { isLocalDev } from '@makerx/node-common'
import twilio from 'twilio'
import { localDev, sms } from '../config'
import { logger } from '../logger'
import { Lazy } from './lazy'

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
  return client().messages.create({
    body: message,
    from: sms.from,
    to,
  })
}
