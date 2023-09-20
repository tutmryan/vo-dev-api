import { logger } from '@azure/identity'
import { omit } from 'lodash'
import { In } from 'typeorm'
import { PRESENTED_CREDENTIALS_TTL, presentedCredentialsCache, requestDetailsCache } from '../../../cache'
import { dataSource } from '../../../data'
import { PresentationRequestStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import type { PresentationCallbackHandler } from '../../callback'
import { StandardClaims } from '../../contracts/claims'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { PartnerEntity } from '../../network/entities/partner-entity'
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
        if (credential.claims[StandardClaims.issuanceId]) acc.push((credential.claims[StandardClaims.issuanceId] as string).toUpperCase())
        return acc
      }, []) ?? []

    // look up all the issuances
    const issuances = await entityManager.getRepository(IssuanceEntity).findBy({ id: In(issuanceIds) })

    // validate every issuance ID is found
    const invalidIssuanceIds = issuanceIds.filter((issuanceId) => !issuances.some((issuance) => issuance.id === issuanceId))
    if (invalidIssuanceIds.length > 0) throw new Error(`Invalid issuance IDs received: ${invalidIssuanceIds.join(', ')}`)

    // grab the identityId from the presentation request details or the issuance request deets
    let identityId = presentationRequestDetails.identityId

    if (identityId) {
      // validate every presentation issuance is for the identity specified in the request
      const invalidIdentityIssuanceIds = issuances.filter((issuance) => issuance.identityId !== identityId).map((issuance) => issuance.id)
      if (invalidIdentityIssuanceIds.length > 0)
        throw new Error(
          `Some presentation issuances have a different identity ID from that specified in the request (${identityId}): ${invalidIdentityIssuanceIds.join(
            ', ',
          )}`,
        )
    } else {
      if (issuances.length === 0)
        throw new Error('No identityId or issuanceIds found in presentation request or presented credential claims')
      identityId = issuances[0]!.identityId
    }
    invariant(identityId, 'identityId could not be determined')

    // save presented credential data minus the claims, which is probably PII
    const presentedCredentials: PresentedData[] = event.verifiedCredentialsData
      ? event.verifiedCredentialsData.map((credential) => omit(credential, 'claims'))
      : []
    const presentedIssuers = presentedCredentials.map((c) => c.issuer)
    const partners = await entityManager.getRepository(PartnerEntity).findBy({ did: In([...new Set(presentedIssuers)]) })
    const { requestedById, requestedCredentials } = presentationRequestDetails
    const presentationEntity = new PresentationEntity({
      requestId: event.requestId,
      requestedById,
      identityId,
      issuanceIds,
      requestedCredentials,
      presentedCredentials,
      partnerIds: partners.map((p) => p.id),
    })

    const { id } = await entityManager.getRepository(PresentationEntity).save(presentationEntity)
    topicData.presentationId = id

    presentedCredentialsCache.set(event.requestId, JSON.stringify(event.verifiedCredentialsData || []), {
      ttl: PRESENTED_CREDENTIALS_TTL,
    })
  }

  await publishPresentationEvent(topicData)

  if (event.requestStatus === PresentationRequestStatus.RequestRetrieved) logger.info('Presentation started', { event })
  else logger.info('Presentation verified', { event })
}
