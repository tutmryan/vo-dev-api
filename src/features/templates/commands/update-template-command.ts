import type { CommandContext } from '../../../cqrs/command-context'
import type { TemplateInput } from '../../../generated/graphql'
import { TemplateEntity } from '../entities/template-entity'
import { ensureNoIntersectingTemplateData, toDisplayModel, toTemplateParentData } from '../mapping'

export async function UpdateTemplateCommand(this: CommandContext, id: string, input: TemplateInput) {
  const repository = this.entityManager.getRepository(TemplateEntity)
  const template = await repository.findOneByOrFail({ id })

  const parent = input.parentTemplateId ? await repository.findOneByOrFail({ id: input.parentTemplateId }) : null
  if (parent) {
    ensureNoIntersectingTemplateData(toTemplateParentData(input), await parent.combinedData())
  }

  await template.update({
    name: input.name,
    description: input.description,
    isPublic: input.isPublic ?? null,
    validityIntervalInSeconds: input.validityIntervalInSeconds ?? null,
    credentialTypes: input.credentialTypes ?? null,
    display: toDisplayModel(input.display),
    parent,
  })

  return await repository.save(template)
}
