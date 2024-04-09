import { basename } from 'path'
import type { CommandContext } from '../../../cqs'
import type { TemplateInput } from '../../../generated/graphql'
import { validateContractClaims } from '../../contracts/claims'
import { validateDisplayLogoImage, validateDisplayLogoUri } from '../../contracts/validation'
import { TemplateEntity } from '../entities/template-entity'
import { ensureNoIntersectingTemplateData, toPersistedDisplayModel, toTemplateParentData } from '../mapping'

export async function UpdateTemplateCommand(this: CommandContext, id: string, input: TemplateInput) {
  const repository = this.entityManager.getRepository(TemplateEntity)

  validateContractClaims(input.display?.claims)

  const template = await repository.findOneByOrFail({ id })

  const parent = input.parentTemplateId ? await repository.findOneByOrFail({ id: input.parentTemplateId }) : null
  if (parent) {
    ensureNoIntersectingTemplateData(toTemplateParentData(input), await parent.combinedData())
  }

  if (template.display?.card?.logo?.uri)
    await this.services.logoImages.deleteIfExists(decodeURIComponent(basename(template.display.card.logo.uri)))

  if (input.display?.card?.logo?.image) {
    await validateDisplayLogoImage(input.display.card.logo.image)
  }

  const displayLogoUri = input.display?.card?.logo?.image
    ? await this.services.logoImages.uploadDataUrl(id, input.display.card.logo.image, { appendExtension: true })
    : input.display?.card?.logo?.uri?.toString() ?? null

  if (displayLogoUri) validateDisplayLogoUri(displayLogoUri)

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
