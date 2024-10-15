import { isLocalDev } from '@makerx/node-common'
import type { EmailData } from '@sendgrid/helpers/classes/email-address'
import type { MailDataRequired } from '@sendgrid/mail'
import client from '@sendgrid/mail'
import { localDev, email } from '../config'
import { logger } from '../logger'
import { Lazy } from './lazy'
import { isObject } from './type-helpers'

const mailClient = Lazy(() => {
  client.setApiKey(email.apiKey)
  return client
})

type MailTo = MailDataRequired['to']

export const extractAllowedEmails = (to: MailTo, allowList: string[]) => {
  const blocked = new Array<EmailData>()
  const allowed = new Array<EmailData>()

  if (!to) {
    return { blocked, allowed }
  }

  for (const email of Array.isArray(to) ? to : [to]) {
    let matched = false
    for (const emailMatch of allowList) {
      const emailAddress = isObject(email) ? email.email : email
      const domain = emailMatch.slice(2)
      if ((emailMatch.startsWith('*@') && emailAddress.endsWith(domain)) || emailMatch === emailAddress) {
        matched = true
        break
      }
    }
    ;(matched ? allowed : blocked).push(email)
  }

  return { blocked, allowed }
}

const maskEmail = (email: string) => {
  const [box, domain] = email.split('@')
  return `${box?.replace(/./g, '*')}@${domain}`
}

const sendEmail = async (to: MailTo, data: MailDataRequired) => {
  if (isLocalDev) {
    if (!localDev) {
      logger.warn('Local dev is detected but no local dev config was provided. No emails will be sent until this is fixed.')
      return
    }
    if (localDev.email.disabled) {
      logger.debug('Email sending is disabled by the local dev config')
      return
    }

    const { blocked, allowed } = extractAllowedEmails(to, localDev.email.allowList)

    if (blocked.length) {
      logger.warn(`Blocked sending email to ${blocked.map((e) => maskEmail(isObject(e) ? e.email : e)).join(', ')}`)
    }
    if (!allowed.length) {
      logger.warn('All recipients were blocked')
      return
    }

    // Override the original recipients with the allowed ones
    data.to = allowed
  }

  return await mailClient().send(data)
}

interface IssuanceEmailTemplateData {
  subjectOrganisation: string
  subjectCredentialName: string
  preheaderIdentityName: string
  preheaderOrganisation: string
  preheaderCredentialName: string
  identityName: string
  issuer: string
  credentialName: string
  verificationMethod: string
  expiry: string
  issuerContact: string
  issuerTeam: string
  issuanceUrl: string
}

export const sendIssuanceEmail = async ({
  to,
  ...dynamicTemplateData
}: {
  to: MailTo
} & IssuanceEmailTemplateData) => {
  const data = {
    templateId: email.templates.issuance.id,
    asm: email.templates.issuance.asm,
    from: email.from,
    personalizations: [
      {
        to,
        dynamicTemplateData,
      },
    ],
  } as MailDataRequired
  await sendEmail(to, data)
}

interface VerificationCodeTemplateData {
  preheaderIdentityName: string
  identityName: string
  credentialName: string
  code: string
  codeLifetimeMinutes: string
  issuerContact: string
  issuerTeam: string
}

export const sendVerificationCodeEmail = async ({
  to,
  ...dynamicTemplateData
}: {
  to: MailDataRequired['to']
} & VerificationCodeTemplateData) => {
  const data = {
    templateId: email.templates.verification.id,
    asm: email.templates.verification.asm,
    from: email.from,
    personalizations: [
      {
        to,
        dynamicTemplateData,
      },
    ],
  } as MailDataRequired
  await sendEmail(to, data)
}
