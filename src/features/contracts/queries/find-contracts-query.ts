import type { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere } from 'typeorm'
import { ILike, IsNull, Not, Raw } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { ContractWhere, Maybe } from '../../../generated/graphql'
import { ContractOrderBy, OrderDirection } from '../../../generated/graphql'
import { OptionalRange } from '../../../util/typeorm'
import { ContractEntity } from '../entities/contract-entity'

export async function FindContractsQuery(
  this: QueryContext,
  criteria?: Maybe<ContractWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<ContractOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<ContractEntity> = {}
  const relations: FindOptionsRelations<ContractEntity> = {}
  const order: FindOptionsOrder<ContractEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.templateId) where.templateId = criteria.templateId
  if (criteria?.isProvisioned !== null && criteria?.isProvisioned !== undefined)
    where.provisionedAt = criteria.isProvisioned ? Not(IsNull()) : IsNull()

  let whereAny: FindOptionsWhere<ContractEntity>[] | undefined
  if (criteria?.credentialTypes)
    whereAny = criteria.credentialTypes.map((type) => ({
      ...where,
      credentialTypesJson: ILike(`%"${type}"%`),
    }))
  if (criteria?.createdById) where.createdById = criteria.createdById.toUpperCase()
  where.createdAt = OptionalRange(criteria?.createdFrom, criteria?.createdTo)

  if (criteria && criteria.isDeprecated !== null && criteria.isDeprecated !== undefined)
    where.isDeprecated = Raw((alias) => `ISNULL(${alias}, 0) = :isDeprecated`, { isDeprecated: criteria.isDeprecated })

  if (criteria?.faceCheckSupport !== null && criteria?.faceCheckSupport !== undefined) {
    where.faceCheckSupport = criteria.faceCheckSupport
  }

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case ContractOrderBy.ContractName:
      order.name = direction
      break
    case ContractOrderBy.CreatedByName:
      relations.createdBy = true
      order.createdBy = { name: direction }
      break
    case ContractOrderBy.CreatedAt:
      order.createdAt = orderDirection ?? OrderDirection.Desc
      break
    default:
      order.createdAt = orderDirection ?? OrderDirection.Desc
      break
  }

  const contracts = await this.entityManager.getRepository(ContractEntity).find({
    comment: 'FindContractsQuery',
    where: whereAny ?? where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })

  return contracts
}
