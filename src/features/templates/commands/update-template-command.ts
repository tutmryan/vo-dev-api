import type { CommandContext } from '../../../cqrs/command-context'
import type { TemplateInput } from '../../../generated/graphql'
import { validateContractClaims } from '../../contracts/claims'
import { assignLogoUri } from '../../contracts/mapping'
import { TemplateEntity } from '../entities/template-entity'
import { ensureNoIntersectingTemplateData, toDisplayModel, toTemplateParentData } from '../mapping'

export async function UpdateTemplateCommand(this: CommandContext, id: string, input: TemplateInput) {
  const repository = this.entityManager.getRepository(TemplateEntity)

  validateContractClaims(input.display?.claims)

  const template = await repository.findOneByOrFail({ id })

  const parent = input.parentTemplateId ? await repository.findOneByOrFail({ id: input.parentTemplateId }) : null
  if (parent) {
    ensureNoIntersectingTemplateData(toTemplateParentData(input), await parent.combinedData())
  }

  if (input.display?.card?.logo?.image) {
    await this.services.logoImages.uploadDataUrl(id, input.display.card.logo.image)
    assignLogoUri(input.display.card.logo, id)
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
