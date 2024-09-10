import twilio from 'twilio'
import { sms } from '../config'
import { Lazy } from '../util/lazy'

const client = Lazy(() => {
  return twilio(sms.sid, sms.secret, { accountSid: sms.accountSid })
})

export function sendSms(to: string, message: string) {
  return client().messages.create({
    body: message,
    from: sms.from,
    to,
  })
}
