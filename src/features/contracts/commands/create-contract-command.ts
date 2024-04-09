import { randomUUID } from 'crypto'
import type { CommandContext } from '../../../cqs'
import { FaceCheckPhotoSupport, type ContractInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { TemplateEntity } from '../../templates/entities/template-entity'
import { ContractEntity } from '../entities/contract-entity'
import { ensureNoOverridingTemplateData, toPersistedDisplayModel } from '../mapping'
import { LogoImageOrUriRequiredError, validateContractInput, validateDisplayLogoUri } from '../validation'

export async function CreateContractCommand(this: CommandContext, input: ContractInput) {
  const { templateId, display: displayInput, faceCheckSupport, ...rest } = input

  await validateContractInput(input)

  const template = input.templateId
    ? await this.entityManager.getRepository(TemplateEntity).findOneByOrFail({ id: input.templateId })
    : null

  if (template) {
    ensureNoOverridingTemplateData(input, await template.combinedData())
  }

  const contractId = randomUUID().toUpperCase()

  const displayLogoUri = displayInput.card.logo.image
    ? await this.services.logoImages.uploadDataUrl(contractId, displayInput.card.logo.image, {
        appendExtension: true,
      })
    : displayInput.card.logo.uri?.toString() ?? undefined

  invariant(displayLogoUri, LogoImageOrUriRequiredError)

  validateDisplayLogoUri(displayLogoUri)

  const contract = new ContractEntity({
    ...rest,
    display: toPersistedDisplayModel(displayInput, displayLogoUri),
    id: contractId,
    template,
    faceCheckSupport: faceCheckSupport ?? FaceCheckPhotoSupport.None,
  })

  return await this.entityManager.getRepository(ContractEntity).save(contract)
}
