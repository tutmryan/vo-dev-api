import type { VerifiedOrchestrationEntityManager } from '../../../data/entity-manager'
import { AsyncIssuanceService } from '../../../services/async-issuance-service'
import { invariant } from '../../../util/invariant'
import type { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { deleteLimitedAsyncIssuanceData, getLimitedAsyncIssuanceDataByKey } from '../../limited-async-issuance-tokens'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

export async function completeAsyncIssuance(
  asyncIssuanceKey: string,
  issuance: IssuanceEntity,
  entityManager: VerifiedOrchestrationEntityManager,
) {
  const asyncIssuanceRepo = entityManager.getRepository(AsyncIssuanceEntity)

  // look up the data by key
  const asyncIssuanceData = await getLimitedAsyncIssuanceDataByKey(asyncIssuanceKey)
  invariant(asyncIssuanceData, 'Async issuance data not found')

  // update and persist the async issuance
  const asyncIssuanceEntity = await asyncIssuanceRepo.findOneByOrFail({ id: asyncIssuanceData.asyncIssuanceRequestId })
  asyncIssuanceEntity.issued(issuance)
  await asyncIssuanceRepo.save(asyncIssuanceEntity)

  // delete the async issuance data
  await new AsyncIssuanceService().deleteAsyncIssuanceIfExists(asyncIssuanceEntity.id, asyncIssuanceEntity.expiry)

  // delete the async issuance session data
  await deleteLimitedAsyncIssuanceData(asyncIssuanceKey)
}
