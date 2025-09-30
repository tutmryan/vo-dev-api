import { notifyApplicationLabelConfigChanged } from '..'
import type { CommandContext } from '../../../cqs'
import type { ApplicationLabelConfigInput } from '../../../generated/graphql'
import { ApplicationLabelConfigEntity } from '../entities/application-label-config-entity'

export async function SetApplicationLabelConfigsCommand(
  this: CommandContext,
  identityStoreId: string,
  input: ApplicationLabelConfigInput[],
): Promise<ApplicationLabelConfigEntity[]> {
  const repo = this.entityManager.getRepository(ApplicationLabelConfigEntity)

  await repo.delete({ identityStoreId })

  const entities = input.map((item) => new ApplicationLabelConfigEntity({ ...item, identityStoreId }))

  const applicationLabels = await repo.save(entities)
  notifyApplicationLabelConfigChanged()
  return applicationLabels
}
