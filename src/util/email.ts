import type { MailDataRequired } from '@sendgrid/mail'
import client from '@sendgrid/mail'
import { email } from '../config'
import { Lazy } from './lazy'

const mailClient = Lazy(() => {
  client.setApiKey(email.apiKey)
  return client
})

interface IssuanceEmailTemplateData {
  preheaderCredentialName: string
  credentialName: string
  issuanceUrl: string
}

export const sendIssuanceEmail = async ({
  to,
  ...dynamicTemplateData
}: {
  to: MailDataRequired['to']
} & IssuanceEmailTemplateData) => {
  const data = {
    templateId: email.templates.issuance,
    from: email.from,
    personalizations: [
      {
        to,
        dynamicTemplateData,
      },
    ],
  } as MailDataRequired
  await mailClient().send(data)
}

interface VerificationCodeTemplateData {
  preheader: string
  instruction: string
  code: string
  codeInstruction: string
}

export const sendVerificationCodeEmail = async ({
  to,
  ...dynamicTemplateData
}: {
  to: MailDataRequired['to']
} & VerificationCodeTemplateData) => {
  const data = {
    templateId: email.templates.verificationCode,
    from: email.from,
    personalizations: [
      {
        to,
        dynamicTemplateData,
      },
    ],
  } as MailDataRequired
  await mailClient().send(data)
}
