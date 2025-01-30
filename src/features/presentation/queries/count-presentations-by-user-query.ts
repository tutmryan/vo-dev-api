import type { QueryContext } from '../../../cqs'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { PresentationEntity } from '../entities/presentation-entity'
import { FACE_CHECK_REQUESTED_LIKE_MATCH } from './find-presentations-query'

export async function CountPresentationsByUserQuery(
  this: QueryContext,
  criteria?: Maybe<PresentationWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const {
    entityManager,
    dataLoaders: { users },
  } = this
  const query = entityManager
    .getRepository(PresentationEntity)
    .createQueryBuilder('p')
    .select('COUNT(*)', 'count')
    .addSelect('LOWER(p.requested_by_id) as requested_by_id')
    .groupBy('p.requested_by_id')
    .orderBy('count', 'DESC')
    .where('1=1')
    .comment('CountPresentationsByUserQuery')

  if (offset) query.skip(offset)
  if (limit) query.take(limit)

  if (criteria?.requestId) query.andWhere('p.request_id = :requestId', { requestId: criteria.requestId })
  if (criteria?.identityId) query.andWhere('p.identity_id = :identityId', { identityId: criteria.identityId })
  if (criteria?.contractId || criteria?.issuanceId) {
    query.innerJoin('presentation_issuances', 'pi', 'p.id = pi.presentation_id')
    query.innerJoin('issuance', 'i', 'pi.issuance_id = i.id')
    if (criteria.contractId) query.andWhere('contract_id = :contractId', { contractId: criteria.contractId })
    if (criteria.issuanceId) query.andWhere('issuance_id = :issuanceId', { issuanceId: criteria.issuanceId })
  }
  if (criteria?.requestedById) throw new Error("Sorry, can't filter by requestedById when grouping by requested by user.")
  if (criteria?.partnerId) {
    query.innerJoin('presentation_partners', 'pp', 'p.id = pp.presentation_id')
    query.andWhere('partner_id = :partnerId', { partnerId: criteria.partnerId })
  }
  if (criteria?.oidcClientId) query.andWhere('oidc_client_id = :oidcClientId', { oidcClientId: criteria.oidcClientId })

  if (criteria?.from && criteria.to)
    query.andWhere('presented_at BETWEEN :from AND :to', { from: criteria.from.toISOString(), to: criteria.to.toISOString() })
  else if (criteria?.from) query.andWhere('presented_at >= :from', { from: criteria.from.toISOString() })
  else if (criteria?.to) query.andWhere('presented_at <= :to', { to: criteria.to.toISOString() })

  if (criteria?.isFaceCheckRequested === true)
    query.andWhere('requested_credentials_json LIKE :faceCheckRequested', { faceCheckRequested: FACE_CHECK_REQUESTED_LIKE_MATCH })
  else if (criteria?.isFaceCheckRequested === false)
    query.andWhere('requested_credentials_json NOT LIKE :faceCheckRequested', { faceCheckRequested: FACE_CHECK_REQUESTED_LIKE_MATCH })

  return query.getRawMany().then((rows) => rows.map((row) => ({ user: users.load(row.requested_by_id), count: row.count })))
}
