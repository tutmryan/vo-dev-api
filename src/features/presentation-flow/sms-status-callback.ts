import { buildBaseRequestInfo } from '@makerx/graphql-core'
import bodyParser from 'body-parser'
import type { Express } from 'express'
import { AuditEvents } from '../../audit-types'
import { apiUrl } from '../../config'
import type { CommandContext } from '../../cqs'
import { runInTransaction } from '../../data'
import { CommunicationPurpose, CommunicationStatus, ContactMethod } from '../../generated/graphql'
import { logger as globalLogger, type Logger } from '../../logger'
import { smsPayloadSchema, toUserErrorMessage, validateSmsCallbackRequest, type MessageStatuses } from '../../util/sms'
import { CommunicationEntity } from '../communication/entities/communication-entity'
import { SYSTEM_USER_ID } from '../users/entities/user-entity'
import { PresentationFlowEntity } from './entities/presentation-flow-entity'

export const getPresentationFlowSmsStatusCallbackUrl = (presentationFlowId: string) => {
  return `${apiUrl}/external/callback/sms/presentation-flow/${presentationFlowId}`
}

export type PresentationFlowSmsStatusCallbackType = 'sms'

export interface PresentationFlowSmsStatusCallbackPayload {
  messageStatus: MessageStatuses
  errorCode?: string
}

export async function handlePresentationFlowSmsStatusCallback(
  presentationFlowId: string,
  payload: PresentationFlowSmsStatusCallbackPayload,
  entityManager: CommandContext['entityManager'],
  logger: Logger,
): Promise<void> {
  const errorStatuses: readonly MessageStatuses[] = ['failed', 'undelivered', 'canceled']

  const presentationFlowRepository = entityManager.getRepository(PresentationFlowEntity)
  const presentationFlow = await presentationFlowRepository.findOneByOrFail({ id: presentationFlowId })

  if (!errorStatuses.includes(payload.messageStatus)) {
    logger.auditEvent(AuditEvents.PRESENTATION_FLOW_NOTIFICATION_SMS_STATUS, {
      presentationFlowId,
      status: payload.messageStatus,
    })
    return
  }

  const communicationRepository = entityManager.getRepository(CommunicationEntity)
  const userMessage = toUserErrorMessage(payload.messageStatus, payload.errorCode)

  logger.auditEvent(AuditEvents.PRESENTATION_FLOW_NOTIFICATION_SMS_FAILED, {
    presentationFlowId,
    error: userMessage,
  })

  if (!presentationFlow.isNotificationFinal) {
    presentationFlow.notificationFailed()
    await presentationFlowRepository.save(presentationFlow)
  }

  await communicationRepository.save(
    new CommunicationEntity({
      createdById: presentationFlow.createdById,
      recipientId: presentationFlow.identityId ?? presentationFlow.createdById,
      contactMethod: ContactMethod.Sms,
      purpose: CommunicationPurpose.PresentationFlow,
      presentationFlowId: presentationFlow.id,
      status: CommunicationStatus.Failed,
      details: userMessage,
    }),
  )
}

export async function addPresentationFlowSmsStatusEndpoint(app: Express): Promise<void> {
  app.post('/external/callback/sms/presentation-flow/:presentationFlowId', bodyParser.urlencoded({ extended: false }), async (req, res) => {
    const logger = globalLogger.child({ request: buildBaseRequestInfo(req) })

    try {
      const { presentationFlowId } = req.params as { presentationFlowId: string }
      logger.mergeMeta({ presentationFlowId })

      if (!validateSmsCallbackRequest(req)) {
        logger.warn('Invalid SMS status callback request for presentation flow')
        return res.status(403).send('Invalid request').end()
      }

      const payload = smsPayloadSchema.parse(req.body)
      await runInTransaction(SYSTEM_USER_ID, async (entityManager) => {
        await handlePresentationFlowSmsStatusCallback(presentationFlowId, payload, entityManager, logger)
      })
      return res.status(200).end()
    } catch (error) {
      logger.error(`Error processing SMS status callback`, { error })
      return res.status(400).send('Error processing SMS status callback').end()
    }
  })
}
