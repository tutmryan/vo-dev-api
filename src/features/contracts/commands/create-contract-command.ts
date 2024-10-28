import { isLocalDev } from '@makerx/node-common'
import { randomUUID } from 'crypto'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckSupportEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import { FaceCheckPhotoSupport, type ContractInput } from '../../../generated/graphql'
import { TemplateEntity } from '../../templates/entities/template-entity'
import { ContractEntity } from '../entities/contract-entity'
import { convertLocalDevUriToMicrosoftFriendly } from '../index'
import { ensureNoOverridingTemplateData, toPersistedDisplayModel } from '../mapping'
import { validateContractInput } from '../validation'

registerFeatureCheck(CreateContractCommand, async (...[, input]) => isFaceCheckSupportEnabled(input))

export async function CreateContractCommand(this: CommandContext, input: ContractInput) {
  const { templateId, display: displayInput, faceCheckSupport, ...rest } = input

  validateContractInput(input)

  const template = input.templateId
    ? await this.entityManager.getRepository(TemplateEntity).findOneByOrFail({ id: input.templateId })
    : null
  if (template) await ensureNoOverridingTemplateData(input, await template.combinedData())

  const contractId = randomUUID().toUpperCase()
  let displayLogoUri = await this.services.logoImages.uploadDataUrl(contractId, displayInput.card.logo.image, {
    appendExtension: true,
  })

  if (isLocalDev) {
    // The MS server will not accept the local URL for the logo image. Instead, we will use the local dev proxy to serve
    // the image when using dev tunnels. Otherwise, we will use the demo's site favicon.
    displayLogoUri = convertLocalDevUriToMicrosoftFriendly(displayLogoUri)
  }

  const contract = new ContractEntity({
    ...rest,
    display: toPersistedDisplayModel(displayInput, displayLogoUri),
    id: contractId,
    template,
    faceCheckSupport: faceCheckSupport ?? FaceCheckPhotoSupport.None,
  })

  return await this.entityManager.getRepository(ContractEntity).save(contract)
}
