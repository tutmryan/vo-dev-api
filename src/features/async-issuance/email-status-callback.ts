import bodyParser from 'body-parser'
import type { Express } from 'express'
import { apiUrl } from '../../config'
import type { CommandContext } from '../../cqs'
import { runInTransaction } from '../../data'
import { CommunicationPurpose, ContactMethod } from '../../generated/graphql'
import { logger } from '../../logger'
import {
  emailPayloadSchema,
  toUserErrorMessage,
  validateEmailCallbackRequest,
  type EmailEventPayload,
  type EmailEvents,
} from '../../util/email'
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
): Promise<void> {
  const errorStatuses: readonly EmailEvents[] = ['deferred', 'bounce', 'dropped']

  if (!errorStatuses.includes(payload.event)) {
    return // We only care about statuses indicating failure
  }

  logger.info(`Email ${type} message for async issuance ${asyncIssuanceId} failed with status ${payload.event}`, {
    asyncIssuanceId,
    emailPayload: payload,
  })

  const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
  const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: asyncIssuanceId })
  const communicationRepository = entityManager.getRepository(CommunicationEntity)
  const userMessage = toUserErrorMessage(payload.event)

  logger.audit(`Recording Email ${type} failure for async issuance`, {
    asyncIssuanceId: asyncIssuance.id,
    identityId: asyncIssuance.identityId,
    type,
    error: userMessage,
  })

  asyncIssuance.failed(type === 'issuance' ? 'contact-failed' : 'issuance-verification-failed')
  await asyncIssuanceRepository.save(asyncIssuance)
  await communicationRepository.save(
    new CommunicationEntity({
      createdById: asyncIssuance.createdById,
      recipientId: asyncIssuance.identityId,
      contactMethod: ContactMethod.Email,
      purpose: type === 'issuance' ? CommunicationPurpose.Issuance : CommunicationPurpose.Verification,
      asyncIssuanceId: asyncIssuance.id,
      error: userMessage,
    }),
  )
}

export async function addAsyncIssuanceEmailStatusEndpoint(app: Express): Promise<void> {
  app.post('/external/callback/email/async-issuance/:type/:asyncIssuanceId', bodyParser.text(), async (req, res) => {
    try {
      const { type, asyncIssuanceId } = req.params as { type: EmailStatusCallbackType; asyncIssuanceId: string }

      if (!validateEmailCallbackRequest(req)) {
        logger.warn(`Invalid Email status callback request for async issuance ${type} ${asyncIssuanceId}`)
        return res.status(403).send('Invalid request').end()
      }

      const payload = emailPayloadSchema.parse(JSON.parse(req.body))
      await runInTransaction(SYSTEM_USER_ID, async (entityManager) => {
        await handleEmailStatusCallback(type, asyncIssuanceId, payload, entityManager)
      })
      return res.status(200).end()
    } catch (error) {
      logger.error(`Error processing Email status callback: ${(error as Error).message}`, { error })
      return res.status(400).send('Error processing Email status callback').end()
    }
  })
}
