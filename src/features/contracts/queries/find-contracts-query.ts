import type { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere } from 'typeorm'
import { ILike, IsNull, Not } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { ContractWhere, Maybe } from '../../../generated/graphql'
import { ContractOrderBy, OrderDirection } from '../../../generated/graphql'
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
