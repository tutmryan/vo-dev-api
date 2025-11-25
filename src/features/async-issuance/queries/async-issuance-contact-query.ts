import type { QueryContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

export async function FindAsyncIssuanceContactQuery(this: QueryContext, asyncIssuanceRequestId: string) {
  const {
    entityManager,
    services: { asyncIssuances },
    logger,
  } = this

  logger.mergeMeta({
    asyncIssuanceRequestId,
  })

  const asyncIssuanceEntity = await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  invariant(!asyncIssuanceEntity.isStatusFinal, 'Issuee information is not available for this async issuance request')

  const asyncIssuance = await asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, asyncIssuanceEntity.expiry)
  invariant(asyncIssuance, 'Async issuance data was not found')

  logger.audit('Fetched async issuance contact information')

  return asyncIssuance.contact ?? null
}
