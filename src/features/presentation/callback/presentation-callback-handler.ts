import { omit } from 'lodash'
import { In } from 'typeorm'
import { requestDetailsCache } from '../../../cache'
import { dataSource } from '../../../data'
import { PresentationRequestStatus } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { createVerifiedIdAdminService } from '../../../services'
import { Lazy } from '../../../util/lazy'
import type { PresentationCallbackHandler } from '../../callback'
import { StandardClaims } from '../../contracts/claims'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { getLimitedApprovalDataByKey, setLimitedApprovalDataByKey } from '../../limited-approval-tokens'
import { PartnerEntity } from '../../network/entities/partner-entity'
import type { PresentationRequestDetails } from '../commands/create-presentation-request-command'
import type { PresentedData } from '../entities/presentation-entity'
import { PresentationEntity } from '../entities/presentation-entity'
import { addPresentationDataToCache } from './cache'
import type { PresentationTopicData } from './pubsub'
import { publishPresentationEvent } from './pubsub'

const getPlatformIssuerDid = Lazy(async () => {
  const admin = createVerifiedIdAdminService(logger)
  const authority = await admin.authority()
  return authority.didModel.did
})

export const presentationCallbackHandler: PresentationCallbackHandler = async (event) => {
  const requestDetails = await requestDetailsCache.get(event.requestId)
  if (!requestDetails) {
    logger.error('Failed to locate a matching request details for presentation event', { event })
    return
  }

  const { limitedApprovalKey, ...presentationRequestDetails } = JSON.parse(requestDetails) as PresentationRequestDetails

  // presentation event data will contain everything, including claims
  const topicData: PresentationTopicData = { ...presentationRequestDetails, event }

  if (event.requestStatus === PresentationRequestStatus.PresentationVerified) {
    const entityManager = dataSource.createEntityManager()

    const platformIssuerDid = await getPlatformIssuerDid()

    // grab all the issuance IDs from the presented credential claims if it was issued by the platform instance
    const issuanceIds =
      event.verifiedCredentialsData?.reduce<string[]>((acc, credential) => {
        if (credential.claims[StandardClaims.issuanceId] && credential.issuer === platformIssuerDid)
          acc.push((credential.claims[StandardClaims.issuanceId] as string).toUpperCase())
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
      if (issuances.length > 0) identityId = issuances[0]!.identityId
    }

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

    await addPresentationDataToCache(topicData)

    // if this presentation is for a limited approval flow, save the presentation ID to the limited approval data
    if (limitedApprovalKey) {
      const limitedApprovalData = await getLimitedApprovalDataByKey(limitedApprovalKey)
      await setLimitedApprovalDataByKey(limitedApprovalKey, { ...limitedApprovalData, presentationId: id })
    }

    logger.audit('Presentation complete', { presentation: presentationEntity })
  } else if (event.requestStatus === PresentationRequestStatus.PresentationError)
    logger.audit('Presentation error', { event: omit(event, 'state') })
  else logger.audit('Presentation retrieved', { event: omit(event, 'state') })

  await publishPresentationEvent(topicData)
}
