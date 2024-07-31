import type { FindOptionsOrder, FindOptionsWhere } from 'typeorm'
import { ILike } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { Maybe, PartnerWhere } from '../../../generated/graphql'
import { OrderDirection, PartnerOrderBy } from '../../../generated/graphql'
import { PartnerEntity } from '../entities/partner-entity'

export async function FindPartnersQuery(
  this: QueryContext,
  criteria?: Maybe<PartnerWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<PartnerOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<PartnerEntity> = {}
  const order: FindOptionsOrder<PartnerEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)

  if (criteria?.credentialType) where.credentialTypesJson = ILike(`%"${criteria.credentialType}"%`)
  if (criteria?.linkedDomainUrl) where.linkedDomainUrlsJson = ILike(`%${criteria.linkedDomainUrl}%`)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case PartnerOrderBy.Name:
      order.name = direction
      break
    case PartnerOrderBy.TenantId:
      order.tenantId = direction
      break
    case PartnerOrderBy.IssuerId:
      order.issuerId = direction
      break
    default:
      order.name = direction
      break
  }

  return await this.entityManager.getRepository(PartnerEntity).find({
    comment: 'FindPartnersQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })
}
