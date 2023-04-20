import type { CommandContext } from '../../../cqrs/command-context'
import type { OnboardingInput } from '../../../generated/graphql'
import { sendOnboardingEmail } from '../../../services/email'

export async function BeginOnboardingCommand(this: CommandContext, { email, givenName, familyName }: OnboardingInput) {
  const { b2cUser } = this.services
  const existingUser = await b2cUser.getB2cUser({ email })
  if (!existingUser) {
    await b2cUser.createB2cUser({ email, givenName, familyName, forceChangePasswordNextSignInWithMfa: false })
  }
  await sendOnboardingEmail({ email, name: `${givenName} ${familyName}` }, { first_name: givenName, last_name: familyName })
}
