import { addSeconds } from 'date-fns'
import { omit } from 'lodash'
import { AuditEvents } from '../../../audit-types'
import { ISOLATION_LEVEL, dataSource } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { IssuanceRequestStatus } from '../../../generated/graphql'
import { logger as globalLogger } from '../../../logger'
import { createVerifiedIdAdminService } from '../../../services'
import { invariant } from '../../../util/invariant'
import { completeAsyncIssuance } from '../../async-issuance'
import { getAsyncIssuanceDataBySessionKey } from '../../async-issuance/session'
import type { IssuanceCallbackHandler } from '../../callback'
import { requestDetailsCache } from '../../callback/cache'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import type { IssuanceRequestDetails } from '../commands/create-issuance-request-command'
import { IssuanceEntity } from '../entities/issuance-entity'
import { addIssuanceDataToCache } from './cache'
import type { IssuanceTopicData } from './pubsub'
import { publishIssuanceEvent } from './pubsub'

export const issuanceCallbackHandler: IssuanceCallbackHandler = async (event) => {
  const eventReceived = Date.now()
  const logger = globalLogger.child({ correlationId: event.requestId })

  const requestDetails = await requestDetailsCache().get(event.requestId)
  if (!requestDetails) {
    logger.error('Failed to locate a matching request details for issuance event', { event })
    return
  }

  const { photoCaptureRequestId, asyncIssuanceKey, ...issuanceRequestDetails } = JSON.parse(requestDetails) as IssuanceRequestDetails
  const topicData: IssuanceTopicData = { ...issuanceRequestDetails, event }
  const asyncIssuanceData = asyncIssuanceKey ? await getAsyncIssuanceDataBySessionKey(asyncIssuanceKey) : null

  if (asyncIssuanceData)
    logger.mergeMeta({
      correlationId: asyncIssuanceData.asyncIssuanceRequestId,
      asyncIssuanceRequestId: asyncIssuanceData.asyncIssuanceRequestId,
    })

  if (event.requestStatus === IssuanceRequestStatus.IssuanceSuccessful) {
    await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
      // look up the contract to get the validity interval
      const contract = await entityManager.getRepository(ContractEntity).findOneByOrFail({ id: issuanceRequestDetails.contractId })
      let validityIntervalInSeconds = contract.validityIntervalInSeconds
      // if the contract has unpublished changes, use the validity interval from the published contract
      if (contract.hasUnpublishedChanges) {
        const adminService = createVerifiedIdAdminService(logger)
        const publishedContract = await adminService.contract(contract.externalId!)
        const publishedValidityInterval = publishedContract?.rules.validityInterval
        invariant(publishedValidityInterval, 'Published contract validity interval not found')
        validityIntervalInSeconds = publishedValidityInterval
      }
      // create issuance record including expiresAt defn
      const issuance = new IssuanceEntity({
        ...issuanceRequestDetails,
        requestId: event.requestId,
        expiresAt: issuanceRequestDetails.expirationDate ?? addSeconds(eventReceived, validityIntervalInSeconds),
      })
      addUserToManager(entityManager, issuanceRequestDetails.issuedById)
      const { id } = await entityManager.getRepository(IssuanceEntity).save(issuance)
      topicData.issuanceId = id
      logger.auditEvent(AuditEvents.ISSUANCE_CREDENTIAL_ISSUED, { issuance })

      // if this was an async issuance, complete it
      if (asyncIssuanceKey) await completeAsyncIssuance(asyncIssuanceKey, issuance, entityManager)
    })
  } else if (event.requestStatus === IssuanceRequestStatus.RequestRetrieved)
    logger.auditEvent(AuditEvents.ISSUANCE_REQUEST_RETRIEVED, { event: omit(event, 'state') })
  else logger.auditEvent(AuditEvents.ISSUANCE_CREDENTIAL_FAILED, { event: omit(event, 'state') })

  await addIssuanceDataToCache(topicData)
  await publishIssuanceEvent(topicData)
}
