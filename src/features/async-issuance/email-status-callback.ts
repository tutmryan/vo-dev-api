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
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'

export const getIssuanceEmailStatusCallbackUrl = (asyncIssuanceId: string) => {
  return `${apiUrl}/external/callback/email/async-issuance/issuance/${asyncIssuanceId}`
}

export const getVerificationEmailStatusCallbackUrl = (asyncIssuanceId: string) => {
  return `${apiUrl}/external/callback/email/async-issuance/verification/${asyncIssuanceId}`
}

export type EmailStatusCallbackType = 'issuance' | 'verification'

export async function handleEmailStatusCallback(
  type: EmailStatusCallbackType,
  asyncIssuanceId: string,
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

  logger.info(`Email ${type} message for async issuance ${asyncIssuanceId} has a status change ${payload.event}`, {
    emailPayload: payload,
  })

  const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
  const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: asyncIssuanceId })
  const communicationRepository = entityManager.getRepository(CommunicationEntity)
  const userMessage = toUserMessage(payload.event)

  // Log appropriate audit event based on status
  if (errorStatuses.includes(payload.event)) {
    logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_NOTIFICATION_EMAIL_FAILED, {
      identityId: asyncIssuance.identityId,
      error: userMessage,
    })
  } else {
    logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_NOTIFICATION_EMAIL_STATUS, {
      identityId: asyncIssuance.identityId,
      status: payload.event,
    })
  }

  if (errorStatuses.includes(payload.event) && !asyncIssuance.isStatusFinal) {
    asyncIssuance.failed(type === 'issuance' ? 'contact-failed' : 'issuance-verification-failed')
    await asyncIssuanceRepository.save(asyncIssuance)
  }

  await communicationRepository.save(
    new CommunicationEntity({
      createdById: asyncIssuance.createdById,
      recipientId: asyncIssuance.identityId,
      contactMethod: ContactMethod.Email,
      purpose: type === 'issuance' ? CommunicationPurpose.Issuance : CommunicationPurpose.Verification,
      asyncIssuanceId: asyncIssuance.id,
      status: errorStatuses.includes(payload.event) ? CommunicationStatus.Failed : CommunicationStatus.Informational,
      details: userMessage,
    }),
  )
}

export async function addAsyncIssuanceEmailStatusEndpoint(app: Express): Promise<void> {
  app.post('/external/callback/email/async-issuance/:type/:asyncIssuanceId', bodyParser.text(), async (req, res) => {
    const logger = globalLogger.child({ request: buildBaseRequestInfo(req) })

    try {
      const { type, asyncIssuanceId } = req.params as { type: EmailStatusCallbackType; asyncIssuanceId: string }
      logger.mergeMeta({ asyncIssuanceRequestId: asyncIssuanceId, type }) // asyncIssuanceRequestId is consistent with GraphQL param names

      if (!validateEmailCallbackRequest(req)) {
        logger.warn('Invalid Email status callback request for async issuance')
        return res.status(403).send('Invalid request').end()
      }

      const payload = emailPayloadSchema.parse(JSON.parse(req.body))
      await runInTransaction(SYSTEM_USER_ID, async (entityManager) => {
        await handleEmailStatusCallback(type, asyncIssuanceId, payload, entityManager, logger)
      })
      return res.status(200).end()
    } catch (error) {
      logger.error(`Error processing Email status callback`, { error })
      return res.status(400).send('Error processing Email status callback').end()
    }
  })
}
