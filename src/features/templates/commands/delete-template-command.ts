import { basename } from 'path'
import type { CommandContext } from '../../../cqrs/command-context'
import { TemplateEntity } from '../entities/template-entity'

export async function DeleteTemplateCommand(this: CommandContext, id: string) {
  const repo = this.entityManager.getRepository(TemplateEntity)
  const template = await repo.findOneByOrFail({ id })
  await repo.remove(template)
  if (template.display?.card?.logo?.uri)
    await this.services.logoImages.deleteIfExists(decodeURIComponent(basename(template.display.card.logo.uri)))
}
