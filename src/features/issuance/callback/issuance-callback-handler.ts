import { logger } from '@azure/identity'
import type { IssuanceRequestDetails } from '../../../cache'
import { requestDetailsCache } from '../../../cache'
import { dataSource } from '../../../data'
import { IssuanceRequestStatus } from '../../../generated/graphql'
import type { IssuanceCallbackHandler } from '../../callback'
import { IssuanceEntity } from '../entities/IssuanceEntity'

export const issuanceCallbackHandler: IssuanceCallbackHandler = async (event) => {
  if (event.requestStatus === IssuanceRequestStatus.RequestRetrieved) {
    logger.info('Issuance started', { event })
    return
  } else if (event.requestStatus === IssuanceRequestStatus.IssuanceError) {
    logger.error('Issuance error', { event })
    return
  }
  logger.info('Issuance completed', { event })

  const requestDetails = await requestDetailsCache.get(event.requestId)
  if (!requestDetails) {
    logger.error('Failed to locate a matching request details for issuance event', { event })
    return
  }

  const issuance = new IssuanceEntity(JSON.parse(requestDetails) as IssuanceRequestDetails)
  await dataSource.createEntityManager().getRepository(IssuanceEntity).save(issuance)
}
