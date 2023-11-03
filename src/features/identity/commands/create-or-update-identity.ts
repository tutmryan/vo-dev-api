import { createOrUpdateIdentity } from '..'
import type { CommandContext } from '../../../cqs'
import type { IdentityInput } from '../../../generated/graphql'

export function CreateOrUpdateIdentityCommand(this: CommandContext, input: IdentityInput) {
  return createOrUpdateIdentity(this.entityManager, input)
}
