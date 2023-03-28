import type { FindOptionsWhere } from 'typeorm'
import { ILike, IsNull } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { Maybe, TemplateWhere } from '../../../generated/graphql'
import { TemplateEntity } from '../entities/template-entity'

export async function FindTemplatesQuery(
  this: QueryContext,
  criteria?: Maybe<TemplateWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const where: FindOptionsWhere<TemplateEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.isRoot) where.parent = IsNull()

  const templates = await this.entityManager.getRepository(TemplateEntity).find({
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
  })

  return templates
}
