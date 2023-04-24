import type { CommandContext } from '../../../cqrs/command-context'
import type { TemplateInput } from '../../../generated/graphql'
import { TemplateEntity } from '../entities/template-entity'
import { toDisplayModel } from '../mapping'

export async function UpdateTemplateCommand(this: CommandContext, id: string, input: TemplateInput) {
  const repository = this.entityManager.getRepository(TemplateEntity)

  const template = await repository.findOneByOrFail({ id })
  if ((await template.children).length !== 0) {
    throw new Error('This template cannot be updated because it has children')
  }

  await template.update({
    name: input.name,
    description: input.description,
    isPublic: input.isPublic ?? null,
    validityIntervalInSeconds: input.validityIntervalInSeconds ?? null,
    credentialTypes: input.credentialTypes ?? null,
    display: toDisplayModel(input.display),
  })

  return await repository.save(template)
}
