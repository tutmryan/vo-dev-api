import { basename } from 'path'
import type { CommandContext } from '../../../cqrs/command-context'
import { ContractEntity } from '../entities/contract-entity'

export async function DeleteContractCommand(this: CommandContext, id: string) {
  const repo = this.entityManager.getRepository(ContractEntity)
  const contract = await repo.findOneByOrFail({ id })
  if (contract.provisionedAt) throw new Error('Contract is already provisioned, it cannot be deleted')
  await repo.remove(contract)
  await this.services.logoImages.deleteIfExists(decodeURIComponent(basename(contract.display.card.logo.uri)))
}
