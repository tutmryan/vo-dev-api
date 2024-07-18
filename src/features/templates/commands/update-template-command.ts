import { basename } from 'path'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckSupportEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import { type TemplateInput } from '../../../generated/graphql'
import { validateTemplateInput } from '../../contracts/validation'
import { TemplateEntity } from '../entities/template-entity'
import { ensureNoIntersectingTemplateData, toPersistedDisplayModel, toTemplateParentData } from '../mapping'

registerFeatureCheck(UpdateTemplateCommand, async (...[, , input]) => isFaceCheckSupportEnabled(input))

export async function UpdateTemplateCommand(this: CommandContext, id: string, input: TemplateInput) {
  const repository = this.entityManager.getRepository(TemplateEntity)

  validateTemplateInput(input)

  const template = await repository.findOneByOrFail({ id })

  const parent = input.parentTemplateId ? await repository.findOneByOrFail({ id: input.parentTemplateId }) : null
  if (parent) {
    await ensureNoIntersectingTemplateData(toTemplateParentData(input), await parent.combinedData())
  }

  if (template.display?.card?.logo?.uri)
    await this.services.logoImages.deleteIfExists(decodeURIComponent(basename(template.display.card.logo.uri)))

  const displayLogoUri = input.display?.card?.logo?.image
    ? await this.services.logoImages.uploadDataUrl(id, input.display.card.logo.image, { appendExtension: true })
    : null

  await template.update({
    name: input.name,
    isPublic: input.isPublic ?? null,
    validityIntervalInSeconds: input.validityIntervalInSeconds ?? null,
    credentialTypes: input.credentialTypes ?? null,
    display: toPersistedDisplayModel(input.display, displayLogoUri),
    parent,
    faceCheckSupport: input.faceCheckSupport ?? null,
  })

  return await repository.save(template)
}
