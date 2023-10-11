import { logger } from '@azure/identity'
import { addSeconds } from 'date-fns'
import { requestDetailsCache } from '../../../cache'
import { ISOLATION_LEVEL, dataSource } from '../../../data'
import { IssuanceRequestStatus } from '../../../generated/graphql'
import { addUserToManager } from '../../auditing/user-context-helper'
import type { IssuanceCallbackHandler } from '../../callback'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import type { IssuanceRequestDetails } from '../commands/create-issuance-request-command'
import { IssuanceEntity } from '../entities/issuance-entity'
import type { IssuanceTopicData } from './pubsub'
import { publishIssuanceEvent } from './pubsub'

export const issuanceCallbackHandler: IssuanceCallbackHandler = async (event) => {
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
      // create issuance record including expiresAt defn
      const issuanceEntity = new IssuanceEntity({
        ...issuanceRequestDetails,
        requestId: event.requestId,
        expiresAt: addSeconds(Date.now(), contract.validityIntervalInSeconds),
      })
      addUserToManager(entityManager, issuanceRequestDetails.issuedById)
      const { id } = await entityManager.getRepository(IssuanceEntity).save(issuanceEntity)
      topicData.issuanceId = id
    })
  }

  await publishIssuanceEvent(topicData)

  if (event.requestStatus === IssuanceRequestStatus.RequestRetrieved) logger.info('Issuance started', { event })
  else if (event.requestStatus === IssuanceRequestStatus.IssuanceError) logger.error('Issuance error', { event })
  else logger.info('Issuance completed', { event })
}
