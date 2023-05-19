import type { MailDataRequired } from '@sendgrid/mail'
import client from '@sendgrid/mail'
import config from '../config'
import { Lazy } from '../util/lazy'

const mailClient = Lazy(() => {
  client.setApiKey(config.get('sendgrid.key'))
  return client
})

export const sendOnboardingEmail = async (to: MailDataRequired['to'], input: { first_name: string; last_name: string }, kyc = false) => {
  const onboardingPath = kyc
    ? config.get('sendgrid.templates.onboarding.kycPath')
    : config.get('sendgrid.templates.onboarding.issuancePath')
  const onboarding_url = new URL(onboardingPath, config.get('sendgrid.templates.onboarding.baseUrl')).href
  const data = {
    ...config.get('sendgrid.templates.onboarding.mailData'),
    personalizations: [
      {
        to,
        dynamicTemplateData: { onboarding_url, ...input },
      },
    ],
  } as MailDataRequired
  await mailClient().send(data)
}
