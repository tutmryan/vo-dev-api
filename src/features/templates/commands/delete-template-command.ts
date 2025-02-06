import { basename } from 'path'
import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { TemplateEntity } from '../entities/template-entity'

export async function DeleteTemplateCommand(this: CommandContext, id: string) {
  const usedByContracts = await this.entityManager.getRepository(ContractEntity).findBy({
    templateId: id,
  })
  invariant(usedByContracts.length === 0, 'Cannot delete template which used by one or more contract.')

  const repo = this.entityManager.getRepository(TemplateEntity)
  const template = await repo.findOneByOrFail({ id })
  await repo.remove(template)
  if (template.display?.card?.logo?.uri)
    await this.services.logoImages.deleteIfExists(decodeURIComponent(basename(template.display.card.logo.uri)))
}
