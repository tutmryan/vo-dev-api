import { startCase } from 'lodash'
import type { WorkerContext } from '../../background-jobs/jobs'
import { portalUrl } from '../../config'
import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import { ContactMethod } from '../../generated/graphql'
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

  // check for notification info, if none is configured, return
  const notification = request.contact?.notification
  if (!notification) return entity

  // generate the issuance URL
  const useOtpVerification = !!request.contact?.verification
  const issuanceUrl = useOtpVerification ? `${portalUrl}/issuance/${requestId}` : `${portalUrl}/issue/${requestId}`

  // send issuance notification + update entity state
  const data: IssuanceCommunicationData = {
    contactMethod: notification.method,
    recipientId: entity.identityId,
    createdById: entity.createdById,
    asyncIssuanceId: requestId,
    issuanceUrl,
    contractName: contract.name,
    expiry: startCase(entity.expiry).toLowerCase(),
    identityName: (await entity.identity).name,
    issuer: contract.display.card.issuedBy,
    verificationMethod: !request.contact?.verification
      ? 'none'
      : request.contact.verification.method === ContactMethod.Email
        ? 'email'
        : 'SMS',
  }

  await communications.sendIssuance(notification.value, data, entityManager)
  entity.contacted()

  return await repo.save(entity)
}
