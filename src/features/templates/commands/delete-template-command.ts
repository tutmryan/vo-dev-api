import type { CommandContext } from '../../../cqrs/command-context'
import { TemplateEntity } from '../entities/template-entity'

export async function DeleteTemplateCommand(this: CommandContext, id: string) {
  const repo = this.entityManager.getRepository(TemplateEntity)
  const template = await repo.findOneByOrFail({ id })
  await repo.remove(template)
  await this.services.logoImages.deleteIfExists(id)
}
