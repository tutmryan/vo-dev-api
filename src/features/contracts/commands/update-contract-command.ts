import type { CommandContext } from '../../../cqrs/command-context'
import type { ContractInput } from '../../../generated/graphql'
import { ContractEntity } from '../entities/contract-entity'
import { ensureNoOverridingTemplateData } from '../mapping'

export async function UpdateContractCommand(this: CommandContext, id: string, input: ContractInput) {
  const repository = this.entityManager.getRepository(ContractEntity)

  const contract = await repository.findOneByOrFail({ id })

  const template = await contract.template
  if (template) {
    ensureNoOverridingTemplateData(input, await template.combinedData())
  }

  await contract.update({
    name: input.name,
    description: input.description,
    isPublic: input.isPublic,
    validityIntervalInSeconds: input.validityIntervalInSeconds,
    display: input.display,
  })

  return await repository.save(contract)
}
