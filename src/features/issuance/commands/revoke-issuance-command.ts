import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function RevokeIssuanceCommand(this: CommandContext, id: string) {
  const {
    user,
    entityManager,
    // services: { request, admin },
  } = this

  userInvariant(user)
  return await entityManager.getRepository(IssuanceEntity).findOneByOrFail({ id })
}
