import type { MailDataRequired } from '@sendgrid/mail'
import client from '@sendgrid/mail'
import config from '../config'
import { Lazy } from '../util/lazy'

const mailClient = Lazy(() => {
  client.setApiKey(config.get('sendgrid.key'))
  return client
})

export const sendOnboardingEmail = async (to: MailDataRequired['to'], input: { first_name: string; last_name: string }) => {
  const data = {
    ...config.get('sendgrid.templates.onboarding.mailData'),
    personalizations: [
      {
        to,
        dynamicTemplateData: { ...config.get('sendgrid.templates.onboarding.dynamicTemplateData'), ...input },
      },
    ],
  } as MailDataRequired
  await mailClient().send(data)
}
