import type { QueryContext } from '../../../cqs'
import {
  MicrosoftEntraTemporaryAccessPassIssuanceOrderBy,
  OrderDirection,
  type Maybe,
  type MicrosoftEntraTemporaryAccessPassIssuanceWhere,
} from '../../../generated/graphql'
import { MicrosoftEntraTemporaryAccessPassIssuanceEntity } from '../entities/microsoft-entra-temporary-access-pass-issuance-entity'

const DEFAULT_LIMIT = 250

export async function FindMicrosoftEntraTemporaryAccessPassIssuancesQuery(
  this: QueryContext,
  criteria?: Maybe<MicrosoftEntraTemporaryAccessPassIssuanceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<MicrosoftEntraTemporaryAccessPassIssuanceOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const qb = this.entityManager
    .getRepository(MicrosoftEntraTemporaryAccessPassIssuanceEntity)
    .createQueryBuilder('microsoftEntraTemporaryAccessPassIssuance')
    .comment('Find Microsoft Entra Temporary Access Pass Issuances query')

  if (criteria?.identityStoreId) {
    qb.andWhere('microsoftEntraTemporaryAccessPassIssuance.identityStoreId = :identityStoreId', {
      identityStoreId: criteria.identityStoreId,
    })
  }
  if (criteria?.identityId) {
    qb.andWhere('microsoftEntraTemporaryAccessPassIssuance.identityId = :identityId', { identityId: criteria.identityId })
  }

  const direction = orderDirection ?? OrderDirection.Desc
  switch (orderBy) {
    case MicrosoftEntraTemporaryAccessPassIssuanceOrderBy.ExpirationTime:
      qb.orderBy('microsoftEntraTemporaryAccessPassIssuance.expirationTime', direction)
      break
    default:
      qb.orderBy('microsoftEntraTemporaryAccessPassIssuance.issuedAt', direction)
      break
  }

  qb.skip(offset ?? 0)
  qb.take(limit ?? DEFAULT_LIMIT)

  return await qb.getMany()
}
