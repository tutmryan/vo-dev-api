import { omit } from 'lodash'
import type { CommandContext } from '../../../cqrs/command-context'
import type { ContractInput } from '../../../generated/graphql'
import { TemplateEntity } from '../../templates/entities/template-entity'
import { validateContractClaims } from '../claims'
import { ContractEntity } from '../entities/contract-entity'
import { applyLogoImageUrlDefault, ensureNoOverridingTemplateData } from '../mapping'

export async function CreateContractCommand(this: CommandContext, input: ContractInput) {
  const template = input.templateId
    ? await this.entityManager.getRepository(TemplateEntity).findOneByOrFail({ id: input.templateId })
    : null

  validateContractClaims(input.display.claims)

  if (template) {
    ensureNoOverridingTemplateData(input, await template.combinedData())
  }

  applyLogoImageUrlDefault(input.display.card.logo)

  const contract = new ContractEntity({
    ...omit(input, 'templateId'),
    template,
  })

  return await this.entityManager.getRepository(ContractEntity).save(contract)
}
