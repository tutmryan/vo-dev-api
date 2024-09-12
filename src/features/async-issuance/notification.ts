import type { WorkerContext } from '../../background-jobs/jobs'
import { portalUrl } from '../../config'
import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import type { IssuanceCommunicationData } from '../../services/communications-service'
import { invariant } from '../../util/invariant'
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'

/**
 * Sends an async issuance notification to the issuee and updates entity state.
 */
export async function sendAsyncIssuanceNotification(
  { services: { asyncIssuances, communications } }: WorkerContext,
  entityManager: VerifiedOrchestrationEntityManager,
  requestId: string,
): Promise<AsyncIssuanceEntity> {
  // load the entity and contract
  const repo = entityManager.getRepository(AsyncIssuanceEntity)
  const entity = await repo.findOneOrFail({ where: { id: requestId }, relations: { contract: true } })
  invariant(!entity.isStatusFinal, 'Invalid status for sending notifications')

  const contract = await entity.contract

  // download the async issuance request data
  const request = await asyncIssuances.downloadAsyncIssuance(requestId, entity.expiry)
  invariant(request, 'Async issuance request data not found')
  const { notification } = request.contact

  // generate the issuance URL
  const issuanceUrl = `${portalUrl}/issuance/${requestId}`

  // send issuance notification + update entity state
  const data: IssuanceCommunicationData = {
    contactMethod: notification.method,
    recipientId: entity.identityId,
    createdById: entity.createdById,
    asyncIssuanceId: requestId,
    issuanceUrl,
    contractName: contract.name,
  }

  await communications.sendIssuance(notification.value, data, entityManager)
  entity.contacted()

  return await repo.save(entity)
}
