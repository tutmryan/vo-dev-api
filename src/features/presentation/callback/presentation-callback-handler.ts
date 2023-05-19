import { logger } from '@azure/identity'
import { omit } from 'lodash'
import type { PresentationRequestDetails } from '../../../cache'
import { requestDetailsCache } from '../../../cache'
import { dataSource } from '../../../data'
import { PresentationRequestStatus } from '../../../generated/graphql'
import type { PresentationCallbackHandler } from '../../callback'
import type { PresentedData } from '../entities/presentation-entity'
import { PresentationEntity } from '../entities/presentation-entity'
import type { PresentationTopicData } from './pubsub'
import { publishPresentationEvent } from './pubsub'

export const presentationCallbackHandler: PresentationCallbackHandler = async (event) => {
  const requestDetails = await requestDetailsCache.get(event.requestId)
  if (!requestDetails) {
    logger.error('Failed to locate a matching request details for presentation event', { event })
    return
  }

  const presentationRequestDetails = JSON.parse(requestDetails) as PresentationRequestDetails
  const topicData: PresentationTopicData = { ...presentationRequestDetails, event }

  if (event.requestStatus === PresentationRequestStatus.PresentationVerified) {
    // save presented credential data minus the claims which is probably PII
    const presentedCredentials: PresentedData[] = event.verifiedCredentialsData
      ? event.verifiedCredentialsData.map((credential) => omit(credential, 'claims'))
      : []
    const presentationEntity = new PresentationEntity({
      ...presentationRequestDetails,
      presentedCredentials,
    })
    const { id } = await dataSource.createEntityManager().getRepository(PresentationEntity).save(presentationEntity)
    topicData.presentationId = id
  }

  await publishPresentationEvent(topicData)

  if (event.requestStatus === PresentationRequestStatus.RequestRetrieved) logger.info('Presentation started', { event })
  else logger.info('Presentation verified', { event })
}
