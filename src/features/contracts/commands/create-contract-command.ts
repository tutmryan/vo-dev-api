import { omit } from 'lodash'
import type { CommandContext } from '../../../cqrs/command-context'
import type { ContractInput } from '../../../generated/graphql'
import { TemplateEntity } from '../../templates/entities/template-entity'
import { ContractEntity } from '../entities/contract-entity'
import { ensureNoOverridingTemplateData } from '../mapping'

export async function CreateContractCommand(this: CommandContext, input: ContractInput) {
  const template = input.templateId
    ? await this.entityManager.getRepository(TemplateEntity).findOneByOrFail({ id: input.templateId })
    : null

  if (template) {
    ensureNoOverridingTemplateData(input, await template.combinedData())
  }

  const contract = new ContractEntity({
    ...omit(input, 'templateId'),
    template,
  })

  return await this.entityManager.getRepository(ContractEntity).save(contract)
}
