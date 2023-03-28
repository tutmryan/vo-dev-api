import type { ContractInput } from '../../../generated/graphql'
import type { CommandContext } from '../../../cqrs/command-context'
import { TemplateEntity } from '../../templates/entities/template-entity'
import { ContractEntity } from '../entities/contract-entity'
import { ensureNoOverridingTemplateData } from '../mapping'
import { omit } from 'lodash'

export async function CreateContractCommand(this: CommandContext, input: ContractInput) {
  const template = input.templateID
    ? await this.entityManager.getRepository(TemplateEntity).findOneByOrFail({ id: input.templateID })
    : null

  if (template) {
    ensureNoOverridingTemplateData(input, await template.combinedData())
  }

  const contract = new ContractEntity({
    ...omit(input, 'templateID'),
    template,
  })

  return await this.entityManager.getRepository(ContractEntity).save(contract)
}
