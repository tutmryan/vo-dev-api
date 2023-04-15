import { createOrUpdateIdentity } from '..'
import type { CommandContext } from '../../../cqrs/command-context'
import type { IdentityInput } from '../../../generated/graphql'

export function CreateOrUpdateIdentityCommand(this: CommandContext, input: IdentityInput) {
  return createOrUpdateIdentity(this.entityManager, input)
}
