import twilio from 'twilio'
import { sms } from '../config'
import { Lazy } from '../util/lazy'

const client = Lazy(() => twilio(sms.sid, sms.secret))

export function sendSms(to: string, message: string) {
  return client().messages.create({
    body: message,
    from: sms.from,
    to,
  })
}
