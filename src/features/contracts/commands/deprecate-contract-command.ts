import type { CommandContext } from '../../../cqrs/command-context'
import { ContractEntity } from '../entities/contract-entity'

export async function DeprecateContractCommand(this: CommandContext, id: string) {
  const repo = this.entityManager.getRepository(ContractEntity)
  const contract = await repo.findOneByOrFail({ id })
  return contract
}
