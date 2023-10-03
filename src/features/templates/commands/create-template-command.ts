import { randomUUID } from 'crypto'
import { merge } from 'lodash'
import type { CommandContext } from '../../../cqrs/command-context'
import type { TemplateInput } from '../../../generated/graphql'
import { validateContractClaims } from '../../contracts/claims'
import { validateDisplayLogo } from '../../contracts/validation'
import { TemplateEntity } from '../entities/template-entity'
import { ensureNoIntersectingTemplateData, toPersistedDisplayModel, toTemplateParentData } from '../mapping'

export async function CreateTemplateCommand(this: CommandContext, input: TemplateInput) {
  const repository = this.entityManager.getRepository(TemplateEntity)

  validateContractClaims(input.display?.claims)

  const parent = input.parentTemplateId ? await repository.findOneByOrFail({ id: input.parentTemplateId }) : null

  if (parent) {
    const parentData = merge({}, toTemplateParentData(parent), await parent.parentData())
    ensureNoIntersectingTemplateData(toTemplateParentData(input), parentData)
  }

  const templateId = randomUUID().toUpperCase()

  const displayLogoUri = input.display?.card?.logo?.image
    ? await this.services.logoImages.uploadDataUrl(templateId, input.display.card.logo.image, { appendExtension: true })
    : input.display?.card?.logo?.uri?.toString() ?? null

  if (displayLogoUri) validateDisplayLogo(displayLogoUri)

  const template = new TemplateEntity({
    id: templateId,
    name: input.name,
    description: input.description,
    isPublic: input.isPublic ?? null,
    validityIntervalInSeconds: input.validityIntervalInSeconds ?? null,
    credentialTypes: input.credentialTypes ?? null,
    parent,
    display: toPersistedDisplayModel(input.display, displayLogoUri),
  })

  return await repository.save(template)
}
