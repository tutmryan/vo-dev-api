import { isLocalDev } from '@makerx/node-common'
import type { EmailData } from '@sendgrid/helpers/classes/email-address'
import type { MailDataRequired } from '@sendgrid/mail'
import client from '@sendgrid/mail'
import { createHmac, timingSafeEqual } from 'crypto'
import type { Request } from 'express'
import z from 'zod'
import { email, localDev } from '../config'
import { logger } from '../logger'
import { Lazy } from './lazy'
import { isObject } from './type-helpers'

const mailClient = Lazy(() => {
  client.setApiKey(email.apiKey)
  return client
})

type MailTo = MailDataRequired['to']

// IANA reserved domains https://en.wikipedia.org/wiki/Example.com, https://www.iana.org/domains/reserved
// 🚨🚨 Do not update this without updating the docs-site documentation and schema.graphql code docs 🚨🚨
export const IANA_RESERVED_DOMAINS = ['example.com', 'example.net', 'example.org', 'example.edu']

const blockFilterList = IANA_RESERVED_DOMAINS.map((i) => `*@${i}`)

export const extractEmails = (to: MailTo, filterMode: 'allow' | 'block', filterList: string[]) => {
  const blocked = new Array<EmailData>()
  const allowed = new Array<EmailData>()

  if (!to) {
    return { blocked, allowed }
  }

  for (const email of Array.isArray(to) ? to : [to]) {
    let matched = false
    for (const emailMatch of filterList) {
      const emailAddress = isObject(email) ? email.email : email
      const domain = emailMatch.slice(2)
      if ((emailMatch.startsWith('*@') && emailAddress.endsWith(domain)) || emailMatch === emailAddress) {
        matched = true
        break
      }
    }
    if (filterMode === 'allow') {
      ;(matched ? allowed : blocked).push(email)
    } else {
      ;(matched ? blocked : allowed).push(email)
    }
  }

  return { blocked, allowed }
}

const maskEmail = (email: string) => {
  const [box, domain] = email.split('@')
  return `${box?.replace(/./g, '*')}@${domain}`
}

// ***** WARNING: Changes to this schema must be reflected in the VO Sendgrid webhook forwarder *****
export const emailPayloadSchema = z.object({
  email: z.string(),
  timestamp: z.number(),
  sgEventId: z.string(),
  sgMessageId: z.string(),
  event: z.union([
    z.literal('processed'),
    z.literal('deferred'),
    z.literal('delivered'),
    z.literal('open'),
    z.literal('click'),
    z.literal('bounce'),
    z.literal('dropped'),
    z.literal('spamreport'),
    z.literal('unsubscribe'),
    z.literal('group_unsubscribe'),
    z.literal('group_resubscribe'),
  ]),
  smtpId: z.string(),
})

// ***** WARNING: Changes to this value must be reflected in the VO Sendgrid webhook forwarder *****
const voForwarderSignatureHeaderKey = 'X-VO-Webhook-Forwarder-Signature'

export type EmailEventPayload = z.infer<typeof emailPayloadSchema>
export type EmailEvents = EmailEventPayload['event']

export function toUserErrorMessage(event: EmailEvents): string {
  switch (event) {
    case 'bounce':
      return 'Email sending failed: Mailbox unavailable'
    case 'deferred':
      return 'Email sending failed: Message deferred (try again later)'
    case 'dropped':
      return 'Email sending failed: Message dropped by recipient server'
  }
  return `Email sending failed: Unknown error`
}

export const validateEmailCallbackRequest = (req: Request) => {
  const hash = req.get(voForwarderSignatureHeaderKey)
  if (!hash) return false

  const hmac = createHmac('sha256', email.webhookForwarder.secret)
  hmac.update(req.body, 'utf8')
  const expectedSigBuf = Buffer.from(hmac.digest('hex'), 'hex')
  const receivedSigBuf = Buffer.from(hash, 'hex')

  if (expectedSigBuf.length !== receivedSigBuf.length) return false

  return timingSafeEqual(new Uint8Array(expectedSigBuf), new Uint8Array(receivedSigBuf))
}

export const sendEmail = async (to: MailTo, data: MailDataRequired, callbackUrl?: string) => {
  if (isLocalDev) {
    if (!localDev) {
      logger.warn('Local dev is detected but no local dev config was provided. No emails will be sent until this is fixed.')
      return
    }
    if (localDev.email.disabled) {
      logger.debug('Email sending is disabled by the local dev config')
      return
    }

    const { blocked, allowed } = extractEmails(to, 'allow', localDev.email.allowList)

    if (blocked.length) {
      logger.warn(`Blocked sending email to ${blocked.map((e) => maskEmail(isObject(e) ? e.email : e)).join(', ')}`)
    }
    if (!allowed.length) {
      logger.warn('All recipients were blocked')
      return
    }

    // Override the original recipients with the allowed ones
    to = allowed
  }

  const { blocked, allowed } = extractEmails(to, 'block', blockFilterList)

  if (blocked.length) {
    logger.warn(
      `Blocked sending email to ${blocked.map((e) => maskEmail(isObject(e) ? e.email : e)).join(', ')} as they are reserved for testing`,
    )
  }

  data.to = allowed

  if (callbackUrl) {
    data.customArgs = {
      ...data.customArgs,
      emailCallbackUrl: callbackUrl,
      // When set, the forwarder will only act if it's the specified hostname. Otherwise, it'll assume that's another forwarder who will handle it
      ...(callbackUrl && email.webhookForwarder.url ? { emailWebhookForwarderUrl: email.webhookForwarder.url } : {}),
    }
  }

  return await mailClient().send(data)
}
