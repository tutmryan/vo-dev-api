import { omit } from 'lodash'
import { In } from 'typeorm'
import { AuditEvents } from '../../../audit-types'
import { addToJobQueue } from '../../../background-jobs'
import { ISOLATION_LEVEL, dataSource } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { PresentationRequestStatus } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { getPlatformIssuerDid } from '../../../services'
import { redactConstraints, redactPresentationReceipt } from '../../../util/redact-values'
import type { PresentationCallbackHandler } from '../../callback'
import { requestDetailsCache } from '../../callback/cache'
import { StandardClaims } from '../../contracts/claims'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { getLimitedPresentationFlowTokenDataByKey, setLimitedPresentationFlowTokenDataByKey } from '../../limited-presentation-flow-tokens'
import { setLoginInteractionData, validateLoginSessionForPresentation } from '../../oidc-provider/session'
import { PartnerEntity } from '../../partners/entities/partner-entity'
import { PresentationFlowEntity } from '../../presentation-flow/entities/presentation-flow-entity'
import { publishPresentationFlowEvent } from '../../presentation-flow/pubsub'
import { WalletEntity } from '../../wallet/entities/wallet-entity'
import type { PresentationRequestDetails } from '../commands/create-presentation-request-command'
import type { PresentedData } from '../entities/presentation-entity'
import { PresentationEntity } from '../entities/presentation-entity'
import { addPresentationDataToCache } from './cache'
import type { PresentationTopicData } from './pubsub'
import { publishPresentationEvent } from './pubsub'

export const presentationCallbackHandler: PresentationCallbackHandler = async (event) => {
  const callbackLogger = logger.child({ presentationRequestId: event.requestId })

  const requestDetails = await requestDetailsCache().get(event.requestId)
  if (!requestDetails) {
    callbackLogger.error('Failed to locate a matching request details for presentation event', { event })
    return
  }

  const { limitedPresentationFlowKey, authnSessionKey, presentationFlowId, ...presentationRequestDetails } = JSON.parse(
    requestDetails,
  ) as PresentationRequestDetails

  const topicData: PresentationTopicData = {
    ...presentationRequestDetails,
    event: {
      ...event,
      receipt: presentationRequestDetails.includeReceipt ? event.receipt : null,
    },
  }

  if (event.requestStatus === PresentationRequestStatus.PresentationVerified) {
    await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
      addUserToManager(entityManager, presentationRequestDetails.requestedById)

      const platformIssuerDid = await getPlatformIssuerDid()

      // grab all the issuance IDs from the presented credential claims if it was issued by the platform instance
      const issuanceIds =
        event.verifiedCredentialsData?.reduce<string[]>((acc, credential) => {
          if (credential.claims[StandardClaims.issuanceId] && credential.issuer === platformIssuerDid)
            acc.push(credential.claims[StandardClaims.issuanceId] as string)
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

      // validate and load the login session data if this presentation is for a login flow
      const authInteractionData = authnSessionKey ? await validateLoginSessionForPresentation(authnSessionKey, event.requestId) : null

      // save presented credential data minus the claims, which is probably PII
      const presentedCredentials: PresentedData[] = event.verifiedCredentialsData
        ? event.verifiedCredentialsData.map((credential) => omit(credential, 'claims'))
        : []
      const presentedIssuers = presentedCredentials.map((c) => c.issuer)
      const partners = await entityManager.getRepository(PartnerEntity).findBy({ did: In([...new Set(presentedIssuers)]) })

      // find or create a wallet entity if the presentation request has a subject
      // assign walletId to the presentation entity if it exists
      let walletId: string | undefined
      if (event.subject) {
        const walletRepository = entityManager.getRepository(WalletEntity)
        const subjectHash = WalletEntity.createSubjectHash(event.subject)
        let wallet = await walletRepository.findOneBy({ subjectHash })
        if (!wallet) {
          wallet = await walletRepository.save(
            new WalletEntity({
              subject: event.subject,
            }),
          )
        }
        walletId = wallet.id
      }

      const { requestedById, requestedCredentials } = presentationRequestDetails
      const presentationEntity = new PresentationEntity({
        requestId: event.requestId,
        requestedById,
        identityId,
        issuanceIds,
        requestedCredentials: redactConstraints(requestedCredentials),
        presentedCredentials,
        partnerIds: partners.map((p) => p.id),
        oidcClientId: authInteractionData?.clientId,
        walletId,
        receiptJson: redactPresentationReceipt(event.receipt),
      })
      const { id } = await entityManager.getRepository(PresentationEntity).save(presentationEntity)
      topicData.presentationId = id

      await addPresentationDataToCache(topicData)

      // if this presentation is for a limited presentation flow, save the presentation ID to the limited presentation flow data cache so the holder can submit actions later
      if (limitedPresentationFlowKey) {
        const existingPresentationFlowData = await getLimitedPresentationFlowTokenDataByKey(limitedPresentationFlowKey)
        await setLimitedPresentationFlowTokenDataByKey(limitedPresentationFlowKey, {
          ...existingPresentationFlowData,
          presentationId: presentationEntity.id,
        })
      }

      // if this presentation is for a presentation flow, save the presentation ID to the request entity
      if (presentationFlowId) {
        const aprRepo = entityManager.getRepository(PresentationFlowEntity)
        const apr = await aprRepo.findOneByOrFail({ id: presentationFlowId })
        apr.presentationId = id

        // auto-submit when there's no data entry, no custom actions, and autoSubmit is not explicitly disabled
        const hasDataSchema = apr.dataSchema && apr.dataSchema.length > 0
        const hasActions = apr.actions && apr.actions.length > 0
        const shouldAutoSubmit = !hasDataSchema && !hasActions && apr.autoSubmit !== false

        if (shouldAutoSubmit) {
          apr.isSubmitted = true
        }

        await aprRepo.save(apr)
        await publishPresentationFlowEvent(presentationFlowId)

        if (shouldAutoSubmit) {
          if (apr.callback) {
            await addToJobQueue('invokePresentationFlowCallback', {
              userId: presentationRequestDetails.requestedById,
              presentationFlowId,
            })
          }
        }
      }

      // if this presentation is for a login flow, set the login interaction data to complete with the presentation ID
      if (authInteractionData && authInteractionData.state !== 'pre-start')
        await setLoginInteractionData({ ...authInteractionData, state: 'complete', presentationId: id })

      callbackLogger.auditEvent(AuditEvents.PRESENTATION_REQUEST_COMPLETED, { presentation: presentationEntity })
    })
  } else if (event.requestStatus === PresentationRequestStatus.PresentationError) {
    callbackLogger.auditEvent(AuditEvents.PRESENTATION_REQUEST_FAILED, { event: omit(event, 'state') })
  } else {
    callbackLogger.auditEvent(AuditEvents.PRESENTATION_REQUEST_RETRIEVED, { event: omit(event, 'state') })

    if (presentationFlowId) {
      await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
        addUserToManager(entityManager, presentationRequestDetails.requestedById)
        const repo = entityManager.getRepository(PresentationFlowEntity)
        const flow = await repo.findOneBy({ id: presentationFlowId })
        if (flow && !flow.isRequestRetrieved) {
          flow.isRequestRetrieved = true
          await repo.save(flow)
          await publishPresentationFlowEvent(presentationFlowId)
        }
      })
    }
  }

  await publishPresentationEvent(topicData)
}
