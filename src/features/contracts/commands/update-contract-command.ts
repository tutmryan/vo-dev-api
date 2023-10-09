import { basename } from 'path'
import type { CommandContext } from '../../../cqrs/command-context'
import type { ContractInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { ContractEntity } from '../entities/contract-entity'
import { ensureNoOverridingTemplateData, toPersistedDisplayModel } from '../mapping'
import { LogoImageOrUriRequiredError, validateContractInput } from '../validation'

export async function UpdateContractCommand(this: CommandContext, id: string, input: ContractInput) {
  const repository = this.entityManager.getRepository(ContractEntity)

  validateContractInput(input)

  const contract = await repository.findOneByOrFail({ id })
  if (contract.isDeprecated) throw new Error('Contract has been deprecated, it cannot be updated')

  const template = input.templateId ? await this.dataLoaders.templates.load(input.templateId) : undefined
  if (template) {
    ensureNoOverridingTemplateData(input, await template.combinedData())
  }

  await this.services.logoImages.deleteIfExists(decodeURIComponent(basename(contract.display.card.logo.uri)))

  const displayLogoUri = input.display.card.logo.image
    ? await this.services.logoImages.uploadDataUrl(id, input.display.card.logo.image, {
        appendExtension: true,
      })
    : input.display.card.logo.uri?.toString() ?? undefined

  invariant(displayLogoUri, LogoImageOrUriRequiredError)

  await contract.update({
    name: input.name,
    credentialTypes: input.credentialTypes,
    isPublic: input.isPublic,
    validityIntervalInSeconds: input.validityIntervalInSeconds,
    display: toPersistedDisplayModel(input.display, displayLogoUri),
    templateId: template?.id ?? null,
  })

  return await repository.save(contract)
}
