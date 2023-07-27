import { logger } from '@azure/identity'
import { omit } from 'lodash'
import type { PresentationRequestDetails } from '../../../cache'
import { requestDetailsCache } from '../../../cache'
import { dataSource } from '../../../data'
import { PresentationRequestStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import type { PresentationCallbackHandler } from '../../callback'
import { StandardClaims } from '../../contracts/claims'
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

  // presentation event data will contain everything, including claims
  const topicData: PresentationTopicData = { ...presentationRequestDetails, event }

  if (event.requestStatus === PresentationRequestStatus.PresentationVerified) {
    // identityId should either be in the request details (for authenticated presentations)
    // or the presented credential claims (for anonymous presentations, via StandardClaims.identityId)
    const identityId =
      presentationRequestDetails.identityId ??
      (event.verifiedCredentialsData?.find((credential) => !!credential.claims[StandardClaims.identityId])?.claims[
        StandardClaims.identityId
      ] as string)

    invariant(identityId, 'identityId must be present in either the request details or the presented credential claims')

    // ensure identityId on the presentation event data reflects the claim value (for anonymous presentations)
    topicData.identityId = identityId

    // save presented credential data minus the claims, which is probably PII
    const presentedCredentials: PresentedData[] = event.verifiedCredentialsData
      ? event.verifiedCredentialsData.map((credential) => omit(credential, 'claims'))
      : []

    const { userId, contractIds, requestedCredentials } = presentationRequestDetails
    const presentationEntity = new PresentationEntity({
      userId,
      identityId,
      contractIds,
      requestedCredentials,
      presentedCredentials,
    })

    const { id } = await dataSource.createEntityManager().getRepository(PresentationEntity).save(presentationEntity)
    topicData.presentationId = id
  }

  await publishPresentationEvent(topicData)

  if (event.requestStatus === PresentationRequestStatus.RequestRetrieved) logger.info('Presentation started', { event })
  else logger.info('Presentation verified', { event })
}
