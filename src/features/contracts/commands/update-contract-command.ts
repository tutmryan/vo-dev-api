import { isLocalDev } from '@makerx/node-common'
import { basename } from 'path'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckSupportEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import { FaceCheckPhotoSupport, type ContractInput } from '../../../generated/graphql'
import { ContractEntity } from '../entities/contract-entity'
import { convertLocalDevUriToMicrosoftFriendly } from '../index'
import { ensureNoOverridingTemplateData, toPersistedDisplayModel } from '../mapping'
import { validateContractInput } from '../validation'

registerFeatureCheck(UpdateContractCommand, async (...[, , input]) => isFaceCheckSupportEnabled(input))

export async function UpdateContractCommand(this: CommandContext, id: string, input: ContractInput) {
  const repository = this.entityManager.getRepository(ContractEntity)

  validateContractInput(input)

  const contract = await repository.findOneByOrFail({ id })
  if (contract.isDeprecated) throw new Error('Contract has been deprecated, it cannot be updated')

  const template = input.templateId ? await this.dataLoaders.templates.load(input.templateId) : undefined
  if (template) await ensureNoOverridingTemplateData(input, await template.combinedData())

  await this.services.logoImages.deleteIfExists(decodeURIComponent(basename(contract.display.card.logo.uri)))
  let displayLogoUri = await this.services.logoImages.uploadDataUrl(id.toUpperCase(), input.display.card.logo.image, {
    appendExtension: true,
  })

  if (isLocalDev) {
    // The MS server will not accept the local URL for the logo image. Instead, we will use the local dev proxy to serve
    // the image when using dev tunnels. Otherwise, we will use the demo's site favicon.
    displayLogoUri = convertLocalDevUriToMicrosoftFriendly(displayLogoUri)
  }

  await contract.update({
    name: input.name,
    credentialTypes: input.credentialTypes,
    isPublic: input.isPublic,
    validityIntervalInSeconds: input.validityIntervalInSeconds,
    display: toPersistedDisplayModel(input.display, displayLogoUri),
    templateId: template?.id ?? null,
    faceCheckSupport: input.faceCheckSupport ?? FaceCheckPhotoSupport.None,
  })

  return await repository.save(contract)
}
