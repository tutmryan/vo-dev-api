import { logger } from '@azure/identity'
import { requestDetailsCache } from '../../../cache'
import { dataSource } from '../../../data'
import { IssuanceRequestStatus } from '../../../generated/graphql'
import type { IssuanceCallbackHandler } from '../../callback'
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
    const issuanceEntity = new IssuanceEntity(issuanceRequestDetails)
    const { id } = await dataSource.createEntityManager().getRepository(IssuanceEntity).save(issuanceEntity)
    topicData.issuanceId = id
  }

  await publishIssuanceEvent(topicData)

  if (event.requestStatus === IssuanceRequestStatus.RequestRetrieved) logger.info('Issuance started', { event })
  else if (event.requestStatus === IssuanceRequestStatus.IssuanceError) logger.error('Issuance error', { event })
  else logger.info('Issuance completed', { event })
}
