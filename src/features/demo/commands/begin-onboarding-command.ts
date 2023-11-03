import type { CommandContext } from '../../../cqs'
import type { OnboardingInput } from '../../../generated/graphql'
import { sendOnboardingEmail } from '../../../services/email'

export async function BeginOnboardingCommand(this: CommandContext, { email, givenName, familyName, kyc }: OnboardingInput) {
  const { b2cGraph: b2cUser } = this.services
  const existingUser = await b2cUser.getUser({ email })
  if (!existingUser) {
    await b2cUser.createUser({ email, givenName, familyName, forceChangePasswordNextSignInWithMfa: false })
  }
  await sendOnboardingEmail({ email, name: `${givenName} ${familyName}` }, { first_name: givenName, last_name: familyName }, kyc === true)
}
