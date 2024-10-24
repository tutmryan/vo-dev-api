import { randomUUID } from 'crypto'
import { merge } from 'lodash'
import { type CommandContext } from '../../../cqs'
import { isFaceCheckSupportEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import { type TemplateInput } from '../../../generated/graphql'
import { validateTemplateInput } from '../../contracts/validation'
import { TemplateEntity } from '../entities/template-entity'
import { ensureNoIntersectingTemplateData, toPersistedDisplayModel, toTemplateParentData, toTemplateParentDataFromInput } from '../mapping'

registerFeatureCheck(CreateTemplateCommand, async (...[, input]) => isFaceCheckSupportEnabled(input))

export async function CreateTemplateCommand(this: CommandContext, input: TemplateInput) {
  const repository = this.entityManager.getRepository(TemplateEntity)

  validateTemplateInput(input)

  const parent = input.parentTemplateId ? await repository.findOneByOrFail({ id: input.parentTemplateId }) : null

  if (parent) {
    const parentData = merge({}, toTemplateParentData(parent), await parent.parentData())
    await ensureNoIntersectingTemplateData(toTemplateParentDataFromInput(input), parentData)
  }

  const templateId = randomUUID().toUpperCase()

  const displayLogoUri = input.display?.card?.logo?.image
    ? await this.services.logoImages.uploadDataUrl(templateId, input.display.card.logo.image, { appendExtension: true })
    : null

  const template = new TemplateEntity({
    id: templateId,
    name: input.name,
    isPublic: input.isPublic ?? null,
    validityIntervalInSeconds: input.validityIntervalInSeconds ?? null,
    credentialTypes: input.credentialTypes ?? null,
    parent,
    display: toPersistedDisplayModel(input.display, displayLogoUri),
    faceCheckSupport: input.faceCheckSupport ?? null,
  })

  return await repository.save(template)
}
