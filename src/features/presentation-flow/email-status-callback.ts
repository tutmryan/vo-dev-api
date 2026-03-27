import { buildBaseRequestInfo } from '@makerx/graphql-core'
import bodyParser from 'body-parser'
import type { Express } from 'express'
import { AuditEvents } from '../../audit-types'
import { apiUrl } from '../../config'
import type { CommandContext } from '../../cqs'
import { runInTransaction } from '../../data'
import { CommunicationPurpose, CommunicationStatus, ContactMethod } from '../../generated/graphql'
import { logger as globalLogger, type Logger } from '../../logger'
import { emailPayloadSchema, toUserMessage, validateEmailCallbackRequest, type EmailEventPayload, type EmailEvents } from '../../util/email'
import { CommunicationEntity } from '../communication/entities/communication-entity'
import { SYSTEM_USER_ID } from '../users/entities/user-entity'
import { PresentationFlowEntity } from './entities/presentation-flow-entity'

export const getPresentationFlowEmailStatusCallbackUrl = (presentationFlowId: string) => {
  return `${apiUrl}/external/callback/email/presentation-flow/${presentationFlowId}`
}

export type PresentationFlowEmailStatusCallbackType = 'email'

export async function handlePresentationFlowEmailStatusCallback(
  presentationFlowId: string,
  payload: EmailEventPayload,
  entityManager: CommandContext['entityManager'],
  logger: Logger,
): Promise<void> {
  const errorStatuses: readonly EmailEvents[] = ['bounce', 'dropped']
  const targetStatuses: readonly EmailEvents[] = [
    'processed',
    'deferred',
    'delivered',
    'open',
    'click',
    'spamreport',
    'unsubscribe',
    'group_unsubscribe',
    'group_resubscribe',
    ...errorStatuses,
  ]

  if (!targetStatuses.includes(payload.event)) {
    return
  }

  logger.info(`Email message for presentation flow ${presentationFlowId} has a status change ${payload.event}`, {
    emailPayload: payload,
  })

  const presentationFlowRepository = entityManager.getRepository(PresentationFlowEntity)
  const presentationFlow = await presentationFlowRepository.findOneByOrFail({ id: presentationFlowId })
  const communicationRepository = entityManager.getRepository(CommunicationEntity)
  const userMessage = toUserMessage(payload.event)

  // Log appropriate audit event based on status
  if (errorStatuses.includes(payload.event)) {
    logger.auditEvent(AuditEvents.PRESENTATION_FLOW_NOTIFICATION_EMAIL_FAILED, {
      presentationFlowId,
      error: userMessage,
    })
  } else {
    logger.auditEvent(AuditEvents.PRESENTATION_FLOW_NOTIFICATION_EMAIL_STATUS, {
      presentationFlowId,
      status: payload.event,
    })
  }

  if (errorStatuses.includes(payload.event) && !presentationFlow.isNotificationFinal) {
    presentationFlow.notificationFailed()
    await presentationFlowRepository.save(presentationFlow)
  }

  await communicationRepository.save(
    new CommunicationEntity({
      createdById: presentationFlow.createdById,
      recipientId: presentationFlow.identityId ?? presentationFlow.createdById,
      contactMethod: ContactMethod.Email,
      purpose: CommunicationPurpose.PresentationFlow,
      presentationFlowId: presentationFlow.id,
      status: errorStatuses.includes(payload.event) ? CommunicationStatus.Failed : CommunicationStatus.Informational,
      details: userMessage,
    }),
  )
}

export async function addPresentationFlowEmailStatusEndpoint(app: Express): Promise<void> {
  app.post('/external/callback/email/presentation-flow/:presentationFlowId', bodyParser.text(), async (req, res) => {
    const logger = globalLogger.child({ request: buildBaseRequestInfo(req) })

    try {
      const { presentationFlowId } = req.params as { presentationFlowId: string }
      logger.mergeMeta({ presentationFlowId })

      if (!validateEmailCallbackRequest(req)) {
        logger.warn('Invalid Email status callback request for presentation flow')
        return res.status(403).send('Invalid request').end()
      }

      const payload = emailPayloadSchema.parse(JSON.parse(req.body))
      await runInTransaction(SYSTEM_USER_ID, async (entityManager) => {
        await handlePresentationFlowEmailStatusCallback(presentationFlowId, payload, entityManager, logger)
      })
      return res.status(200).end()
    } catch (error) {
      logger.error(`Error processing Email status callback`, { error })
      return res.status(400).send('Error processing Email status callback').end()
    }
  })
}
