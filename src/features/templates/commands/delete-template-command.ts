import { basename } from 'path'
import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { TemplateEntity } from '../entities/template-entity'

export async function DeleteTemplateCommand(this: CommandContext, id: string) {
  const contractRepo = this.entityManager.getRepository(ContractEntity)
  const usedByContracts = await contractRepo.findBy({
    templateId: id,
  })
  invariant(usedByContracts.filter((c) => !c.isDeprecated).length === 0, 'Cannot delete a template that is used by active contracts')

  // Remove the template from all contracts to avoid foreign key constraint violation
  usedByContracts.forEach((c) => (c.templateId = null))
  await contractRepo.save(usedByContracts)

  const repo = this.entityManager.getRepository(TemplateEntity)
  const template = await repo.findOneByOrFail({ id })
  await repo.remove(template)
  if (template.display?.card?.logo?.uri)
    await this.services.logoImages.deleteIfExists(decodeURIComponent(basename(template.display.card.logo.uri)))
}
