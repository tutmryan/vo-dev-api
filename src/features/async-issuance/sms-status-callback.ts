import bodyParser from 'body-parser'
import type { Express } from 'express'
import { apiUrl } from '../../config'
import type { CommandContext } from '../../cqs'
import { runInTransaction } from '../../data'
import { CommunicationPurpose, ContactMethod } from '../../generated/graphql'
import { logger } from '../../logger'
import { smsPayloadSchema, toUserErrorMessage, validateSmsCallbackRequest, type MessageStatuses } from '../../util/sms'
import { CommunicationEntity } from '../communication/entities/communication-entity'
import { SYSTEM_USER_ID } from '../users/entities/user-entity'
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'

export const getIssuanceSmsStatusCallbackUrl = (asyncIssuanceId: string) => {
  return `${apiUrl}/external/callback/sms/async-issuance/issuance/${asyncIssuanceId}`
}

export const getVerificationSmsStatusCallbackUrl = (asyncIssuanceId: string) => {
  return `${apiUrl}/external/callback/sms/async-issuance/verification/${asyncIssuanceId}`
}

export type SmsStatusCallbackType = 'issuance' | 'verification'

export interface SmsStatusCallbackPayload {
  messageStatus: MessageStatuses
  errorCode?: string
}

export async function handleSmsStatusCallback(
  type: SmsStatusCallbackType,
  asyncIssuanceId: string,
  payload: SmsStatusCallbackPayload,
  entityManager: CommandContext['entityManager'],
): Promise<void> {
  const errorStatuses: readonly MessageStatuses[] = ['failed', 'undelivered', 'canceled']
  if (!errorStatuses.includes(payload.messageStatus)) {
    return // We only care about statuses indicating failure
  }

  logger.info(`SMS ${type} message for async issuance ${asyncIssuanceId} failed with status ${payload.messageStatus}`, {
    asyncIssuanceId,
    smsPayload: payload,
  })

  const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
  const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: asyncIssuanceId })
  const communicationRepository = entityManager.getRepository(CommunicationEntity)
  const userMessage = toUserErrorMessage(payload.messageStatus, payload.errorCode)

  logger.audit(`Recording SMS ${type} failure for async issuance`, {
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
      contactMethod: ContactMethod.Sms,
      purpose: type === 'issuance' ? CommunicationPurpose.Issuance : CommunicationPurpose.Verification,
      asyncIssuanceId: asyncIssuance.id,
      error: userMessage,
    }),
  )
}

export async function addAsyncIssuanceSmsStatusEndpoint(app: Express): Promise<void> {
  app.post('/external/callback/sms/async-issuance/:type/:asyncIssuanceId', bodyParser.urlencoded({ extended: false }), async (req, res) => {
    try {
      const { type, asyncIssuanceId } = req.params as { type: SmsStatusCallbackType; asyncIssuanceId: string }

      if (!validateSmsCallbackRequest(req)) {
        logger.warn(`Invalid SMS status callback request for async issuance ${type} ${asyncIssuanceId}`)
        return res.status(403).send('Invalid request').end()
      }

      const payload = smsPayloadSchema.parse(req.body)
      await runInTransaction(SYSTEM_USER_ID, async (entityManager) => {
        await handleSmsStatusCallback(type, asyncIssuanceId, payload, entityManager)
      })
      return res.status(200).end()
    } catch (error) {
      logger.error(`Error processing SMS status callback: ${(error as Error).message}`, { error })
      return res.status(400).send('Error processing SMS status callback').end()
    }
  })
}
