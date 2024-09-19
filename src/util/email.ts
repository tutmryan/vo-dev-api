import type { MailDataRequired } from '@sendgrid/mail'
import client from '@sendgrid/mail'
import { email } from '../config'
import { Lazy } from './lazy'

const mailClient = Lazy(() => {
  client.setApiKey(email.apiKey)
  return client
})

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
  to: MailDataRequired['to']
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
  await mailClient().send(data)
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
  await mailClient().send(data)
}
