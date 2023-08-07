import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'
import { ContractEntity } from '../entities/contract-entity'

export async function DeprecateContractCommand(this: CommandContext, id: string) {
  const { user, entityManager } = this

  userInvariant(user)

  const repo = entityManager.getRepository(ContractEntity)
  const contract = await repo.findOneByOrFail({ id })

  // if the contract has been previously deprecated, we don't need to proceed further
  if (contract.isDeprecated) return contract
  if (!contract.provisionedAt) throw new Error('Contract has not been provisioned yet, it can be deleted instead')

  contract.markAsDeprecated(user.userEntity)
  return await repo.save(contract)
}
