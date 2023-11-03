import type { FindOptionsWhere } from 'typeorm'
import { ILike, IsNull } from 'typeorm'
import type { QueryContext } from '../../../cqs'
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

  let whereAny: FindOptionsWhere<TemplateEntity>[] | undefined
  if (criteria?.credentialTypes)
    whereAny = criteria.credentialTypes.map((type) => ({
      ...where,
      credentialTypesJson: ILike(`%"${type}"%`),
    }))

  const templates = await this.entityManager.getRepository(TemplateEntity).find({
    comment: 'FindTemplatesQuery',
    where: whereAny ?? where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
  })

  return templates
}
