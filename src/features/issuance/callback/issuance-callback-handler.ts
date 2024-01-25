import { addSeconds } from 'date-fns'
import { omit } from 'lodash'
import { requestDetailsCache } from '../../../cache'
import { ISOLATION_LEVEL, dataSource } from '../../../data'
import { IssuanceRequestStatus } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { createVerifiedIdAdminService } from '../../../services'
import { invariant } from '../../../util/invariant'
import { addUserToManager } from '../../auditing/user-context-helper'
import type { IssuanceCallbackHandler } from '../../callback'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import type { IssuanceRequestDetails } from '../commands/create-issuance-request-command'
import { IssuanceEntity } from '../entities/issuance-entity'
import type { IssuanceTopicData } from './pubsub'
import { publishIssuanceEvent } from './pubsub'

export const issuanceCallbackHandler: IssuanceCallbackHandler = async (event) => {
  const eventReceived = Date.now()

  const requestDetails = await requestDetailsCache.get(event.requestId)
  if (!requestDetails) {
    logger.error('Failed to locate a matching request details for issuance event', { event })
    return
  }

  const issuanceRequestDetails = JSON.parse(requestDetails) as IssuanceRequestDetails
  const topicData: IssuanceTopicData = { ...issuanceRequestDetails, event }

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
      const issuanceEntity = new IssuanceEntity({
        ...issuanceRequestDetails,
        requestId: event.requestId,
        expiresAt: addSeconds(eventReceived, validityIntervalInSeconds),
      })
      addUserToManager(entityManager, issuanceRequestDetails.issuedById)
      const { id } = await entityManager.getRepository(IssuanceEntity).save(issuanceEntity)
      topicData.issuanceId = id
      logger.audit('Issuance complete', { issuance: issuanceEntity })
    })
  } else if (event.requestStatus === IssuanceRequestStatus.RequestRetrieved)
    logger.audit('Issuance retrieved', { event: omit(event, 'state') })
  else logger.audit('Issuance error', { event: omit(event, 'state') })

  await publishIssuanceEvent(topicData)
}
