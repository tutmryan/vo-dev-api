import { logger } from '@azure/identity'
import { omit } from 'lodash'
import type { PresentationRequestDetails } from '../../../cache'
import { requestDetailsCache } from '../../../cache'
import { dataSource } from '../../../data'
import { PresentationRequestStatus } from '../../../generated/graphql'
import type { PresentationCallbackHandler } from '../../callback'
import type { PresentedData } from '../entities/presentation-entity'
import { PresentationEntity } from '../entities/presentation-entity'

export const presentationCallbackHandler: PresentationCallbackHandler = async (event) => {
  if (event.requestStatus === PresentationRequestStatus.RequestRetrieved) {
    logger.info('Presentation started', { event })
    return
  }
  logger.info('Presentation completed', { event })

  const requestDetails = await requestDetailsCache.get(event.requestId)
  if (!requestDetails) {
    logger.error('Failed to locate a matching request details for presentation event', { event })
    return
  }

  // save a presentation record using requested details,
  // plus presented credential data (minus the claims is probably PII)
  const requested = JSON.parse(requestDetails) as PresentationRequestDetails
  const presentation = new PresentationEntity({
    ...requested,
    presentedCredentials: event.verifiedCredentialsData.map((credential) => omit(credential, 'claims')) as PresentedData[],
  })
  await dataSource.createEntityManager().getRepository(PresentationEntity).save(presentation)
}
