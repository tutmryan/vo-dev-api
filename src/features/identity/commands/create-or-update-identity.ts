import type { CommandContext } from '../../../cqrs/command-context'
import type { IdentityInput } from '../../../generated/graphql'
import { IdentityEntity } from '../entities/identity-entity'

export async function CreateOrUpdateIdentityCommand(this: CommandContext, input: IdentityInput) {
  const repo = this.entityManager.getRepository(IdentityEntity)
  const identity = await repo.findOneBy({ identifier: input.identifier, issuer: input.issuer })

  if (identity) {
    // update if necessary
    if (identity.name !== input.name) {
      identity.name = input.name
      return await repo.save(identity)
    }
    return identity
  }

  return await repo.save(new IdentityEntity(input))
}
