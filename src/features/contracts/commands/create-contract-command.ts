import { randomUUID } from 'crypto'
import { omit } from 'lodash'
import type { CommandContext } from '../../../cqrs/command-context'
import type { ContractInput } from '../../../generated/graphql'
import { TemplateEntity } from '../../templates/entities/template-entity'
import { validateContractClaims } from '../claims'
import { ContractEntity } from '../entities/contract-entity'
import { assignLogoUri, ensureNoOverridingTemplateData } from '../mapping'

export async function CreateContractCommand(this: CommandContext, input: ContractInput) {
  const template = input.templateId
    ? await this.entityManager.getRepository(TemplateEntity).findOneByOrFail({ id: input.templateId })
    : null

  validateContractClaims(input.display.claims)

  if (template) {
    ensureNoOverridingTemplateData(input, await template.combinedData())
  }

  const contractId = randomUUID().toUpperCase()

  if (input.display.card.logo.image) {
    await this.services.logoImages.uploadDataUrl(contractId, input.display.card.logo.image)
    assignLogoUri(input.display.card.logo, contractId)
  }

  const contract = new ContractEntity({
    ...omit(input, 'templateId'),
    id: contractId,
    template,
  })

  return await this.entityManager.getRepository(ContractEntity).save(contract)
}
