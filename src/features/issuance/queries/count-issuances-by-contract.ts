import type { QueryContext } from '../../../cqs'
import type { IssuanceWhere, Maybe } from '../../../generated/graphql'
import { andWhereOptionalRange } from '../../../util/typeorm'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function CountIssuancesByContractQuery(
  this: QueryContext,
  criteria?: Maybe<IssuanceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const {
    entityManager,
    dataLoaders: { contracts },
  } = this
  const query = entityManager
    .getRepository(IssuanceEntity)
    .createQueryBuilder('issuance')
    .select('COUNT(*)', 'count')
    .addSelect('contract_id')
    .groupBy('contract_id')
    .orderBy('count', 'DESC')
    .where('1=1')
    .comment('CountIssuancesByContractQuery')

  if (offset) query.skip(offset)
  if (limit) query.take(limit)

  if (criteria?.requestId) query.andWhere('issuance.request_id = :requestId', { identityId: criteria.requestId.toUpperCase() })
  if (criteria?.identityId) query.andWhere('issuance.identity_id = :identityId', { identityId: criteria.identityId.toUpperCase() })
  if (criteria?.issuedById) query.andWhere('issuance.issued_by_id = :issuedById', { issuedById: criteria.issuedById.toUpperCase() })
  if (criteria?.revokedById) query.andWhere('issuance.revoked_by_id = :revokedById', { revokedById: criteria.revokedById.toUpperCase() })
  if (criteria?.hasFaceCheckPhoto !== null && criteria?.hasFaceCheckPhoto !== undefined)
    query.andWhere('ISNULL(has_face_check_photo, 0) = :hasFaceCheckPhoto', { hasFaceCheckPhoto: criteria.hasFaceCheckPhoto })
  if (criteria?.contractId) throw new Error("Sorry, can't filter by contractId when grouping by contract.")
  if (criteria?.presentationId) {
    query.innerJoin('presentation_issuances', 'pi', 'issuance.id = pi.issuance_id')
    query.innerJoin('presentation', 'p', 'pi.presentation_id = p.id')
    query.andWhere('presentation_id = :presentationId', { presentationId: criteria.presentationId.toUpperCase() })
  }

  andWhereOptionalRange(query, 'issued_at', criteria?.from, criteria?.to)
  andWhereOptionalRange(query, 'expires_at', criteria?.expiresFrom, criteria?.expiresTo)
  andWhereOptionalRange(query, 'revoked_at', criteria?.revokedFrom, criteria?.revokedTo)

  return query.getRawMany().then((rows) => rows.map((row) => ({ contract: contracts.load(row.contract_id), count: row.count })))
}
