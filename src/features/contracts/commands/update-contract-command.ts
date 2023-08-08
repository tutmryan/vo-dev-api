import type { CommandContext } from '../../../cqrs/command-context'
import type { ContractInput } from '../../../generated/graphql'
import { validateContractClaims } from '../claims'
import { ContractEntity } from '../entities/contract-entity'
import { applyLogoImageUrlDefault, ensureNoOverridingTemplateData } from '../mapping'

export async function UpdateContractCommand(this: CommandContext, id: string, input: ContractInput) {
  const repository = this.entityManager.getRepository(ContractEntity)

  validateContractClaims(input.display.claims)

  const contract = await repository.findOneByOrFail({ id })

  const template = input.templateId ? await this.dataLoaders.templates.load(input.templateId) : undefined
  if (template) {
    ensureNoOverridingTemplateData(input, await template.combinedData())
  }

  applyLogoImageUrlDefault(input.display.card.logo)

  await contract.update({
    name: input.name,
    description: input.description,
    credentialTypes: input.credentialTypes,
    isPublic: input.isPublic,
    validityIntervalInSeconds: input.validityIntervalInSeconds,
    display: input.display,
    templateId: template?.id ?? null,
  })

  return await repository.save(contract)
}
