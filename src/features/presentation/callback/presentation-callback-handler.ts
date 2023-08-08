import { logger } from '@azure/identity'
import { omit } from 'lodash'
import { requestDetailsCache } from '../../../cache'
import { dataSource } from '../../../data'
import { PresentationRequestStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import type { PresentationCallbackHandler } from '../../callback'
import { StandardClaims } from '../../contracts/claims'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import type { PresentationRequestDetails } from '../commands/create-presentation-request-command'
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
    const entityManager = dataSource.createEntityManager()

    // grab all the issuance IDs from the presented credential claims
    const issuanceIds =
      event.verifiedCredentialsData?.reduce<string[]>((acc, credential) => {
        if (credential.claims[StandardClaims.issuanceId]) acc.push(credential.claims[StandardClaims.issuanceId] as string)
        return acc
      }, []) ?? []

    // grab the identityId from the presentation request details or the issuance request deets
    let identityId = presentationRequestDetails.identityId
    if (!identityId) {
      if (issuanceIds.length === 0) throw new Error('No identityId or issuanceIds found in presentation request or event data')
      const issuance = await entityManager.getRepository(IssuanceEntity).findOneByOrFail({ id: issuanceIds[0] })
      identityId = issuance.identityId
    }
    invariant(identityId, 'identityId could not be determined')

    // save presented credential data minus the claims, which is probably PII
    const presentedCredentials: PresentedData[] = event.verifiedCredentialsData
      ? event.verifiedCredentialsData.map((credential) => omit(credential, 'claims'))
      : []

    const { userId, requestedCredentials } = presentationRequestDetails
    const presentationEntity = new PresentationEntity({
      userId,
      identityId,
      issuanceIds,
      requestedCredentials,
      presentedCredentials,
    })

    const { id } = await entityManager.getRepository(PresentationEntity).save(presentationEntity)
    topicData.presentationId = id
  }

  await publishPresentationEvent(topicData)

  if (event.requestStatus === PresentationRequestStatus.RequestRetrieved) logger.info('Presentation started', { event })
  else logger.info('Presentation verified', { event })
}
