import type { WorkerContext } from '../../background-jobs/jobs'
import { portalUrl } from '../../config'
import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import { AsyncIssuanceRequestStatus } from '../../generated/graphql'
import type { IssuanceCommunicationData } from '../../services/communications-service'
import { invariant } from '../../util/invariant'
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'

export const validNotificationStatuses = [AsyncIssuanceRequestStatus.Pending, AsyncIssuanceRequestStatus.Failed]

/**
 * Sends an async issuance notification to the issuee and updates entity state.
 * Logs and throws errors if any occur.
 */
export async function sendAsyncIssuanceNotification(
  { logger, services: { asyncIssuances, communications } }: WorkerContext,
  entityManager: VerifiedOrchestrationEntityManager,
  requestId: string,
): Promise<AsyncIssuanceEntity> {
  try {
    // load the entity and contract
    const repo = entityManager.getRepository(AsyncIssuanceEntity)
    const entity = await repo.findOneOrFail({ where: { id: requestId }, relations: { contract: true } })
    invariant(validNotificationStatuses.includes(entity.status), 'Invalid status for sending notifications')

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

    try {
      await communications.sendIssuance(notification.value, data, entityManager)
      entity.contacted()
    } catch (sendError: Error | unknown) {
      logger.error(`Error occurred sending async issuance notification for request ${requestId}`, { error: sendError })
      entity.failed(sendError instanceof Error ? sendError.message : `${sendError}`)
      throw sendError
    }

    // save and return the updated entity
    try {
      return await repo.save(entity)
    } catch (saveError) {
      logger.error(`Error occurred when saving async issuance request ${requestId}`, { error: saveError })
      throw saveError
    }
  } catch (findValidDataError) {
    logger.error(`Error occurred when finding valid data for async issuance request ${requestId}`, { error: findValidDataError })
    throw findValidDataError
  }
}
