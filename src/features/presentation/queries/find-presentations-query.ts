import type { FindOptionsRelations, FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { IssuanceWhere, Maybe } from '../../../generated/graphql'
import { PresentationEntity } from '../entities/presentation-entity'

export async function FindPresentationsQuery(
  this: QueryContext,
  criteria?: Maybe<IssuanceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const where: FindOptionsWhere<PresentationEntity> = {}
  const relations: FindOptionsRelations<PresentationEntity> = {}

  if (criteria?.identityId) where.identityId = criteria.identityId.toUpperCase()
  if (criteria?.userId) where.userId = criteria.userId.toUpperCase()
  if (criteria?.contractId) {
    relations.contracts = true
    where.contracts = { id: criteria.contractId.toUpperCase() }
  }

  const presentations = await this.entityManager.getRepository(PresentationEntity).find({
    where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order: { presentedAt: 'DESC' },
  })

  return presentations
}
