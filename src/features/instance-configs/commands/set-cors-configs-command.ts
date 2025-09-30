import { notifyCorsConfigChanged } from '..'
import type { CommandContext } from '../../../cqs'
import type { CorsOriginConfigInput } from '../../../generated/graphql'
import { CorsOriginConfigEntity } from '../entities/cors-origins-config-entity'

export async function SetCorsOriginConfigsCommand(this: CommandContext, input: CorsOriginConfigInput[]): Promise<CorsOriginConfigEntity[]> {
  const repo = this.entityManager.getRepository(CorsOriginConfigEntity)
  await repo.deleteAll()
  const entities = input.map((item) => new CorsOriginConfigEntity(item))
  const cors = await repo.save(entities)
  notifyCorsConfigChanged()
  return cors
}
