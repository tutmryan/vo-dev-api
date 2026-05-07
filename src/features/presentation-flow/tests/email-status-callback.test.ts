import casual from 'casual'
import { CommunicationStatus, ContactMethod } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { beforeAfterAll, inTransaction } from '../../../test'
import { CommunicationEntity } from '../../communication/entities/communication-entity'
import { createIdentity } from '../../identity/tests/create-identity'
import { SYSTEM_USER_ID } from '../../users/entities/user-entity'
import { getPresentationFlowEmailStatusCallbackUrl, handlePresentationFlowEmailStatusCallback } from '../email-status-callback'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { createPresentationFlow, getDefaultPresentationFlowInput } from './helpers'

describe('Email status callback', () => {
  beforeAfterAll()

  describe('handlePresentationFlowEmailStatusCallback', () => {
    describe('with error status', () => {
      it.each<{
        event: 'bounce' | 'dropped'
        expectedUserMessage: string
      }>([
        {
          event: 'bounce',
          expectedUserMessage: 'Email sending failed: Mailbox unavailable',
        },
        {
          event: 'dropped',
          expectedUserMessage: 'Email sending failed: Message dropped by recipient server',
        },
      ])('handles $event for presentation flow', async ({ event, expectedUserMessage }) => {
        // Arrange
        const identity = await createIdentity()
        const input = await getDefaultPresentationFlowInput()
        input.identityId = identity.id
        input.contact = {
          notification: {
            method: ContactMethod.Email,
            value: casual.email,
          },
        }

        const result = await createPresentationFlow(input)
        const presentationFlowId = result.request.id

        // Act
        await inTransaction(async (entityManager) => {
          await handlePresentationFlowEmailStatusCallback(
            presentationFlowId,
            {
              email: casual.email,
              timestamp: Date.now(),
              sgEventId: casual.uuid,
              sgMessageId: casual.uuid,
              event,
              smtpId: casual.uuid,
            },
            entityManager,
            logger,
          )
        }, SYSTEM_USER_ID)

        // Assert
        await inTransaction(async (entityManager) => {
          const presentationFlowRepository = entityManager.getRepository(PresentationFlowEntity)
          const presentationFlow = await presentationFlowRepository.findOneByOrFail({ id: presentationFlowId })
          expect(presentationFlow.notificationStatus).toBe('FAILED')

          const communicationRepository = entityManager.getRepository(CommunicationEntity)
          const communications = await communicationRepository.find({
            where: { presentationFlowId },
          })
          expect(communications).toHaveLength(1)
          expect(communications[0]?.status).toBe(CommunicationStatus.Failed)
          expect(communications[0]?.details).toBe(expectedUserMessage)
          expect(communications[0]?.contactMethod).toBe(ContactMethod.Email)
          expect(communications[0]?.recipientId).toBe(identity.id)
        })
      })
    })

    describe('with informational status', () => {
      it.each<{
        event: 'processed' | 'delivered' | 'open' | 'click' | 'spamreport' | 'unsubscribe' | 'group_unsubscribe' | 'group_resubscribe'
        expectedUserMessage: string
      }>([
        { event: 'processed', expectedUserMessage: 'Email sending update: Processed for delivery' },
        { event: 'delivered', expectedUserMessage: 'Email sending update: Delivered to recipient' },
        { event: 'open', expectedUserMessage: 'Email sending update: Opened by recipient' },
        { event: 'click', expectedUserMessage: 'Email sending update: Clicked by recipient' },
        { event: 'spamreport', expectedUserMessage: 'Email sending update: Marked as spam by recipient' },
        { event: 'unsubscribe', expectedUserMessage: 'Email sending update: Recipient unsubscribed' },
        { event: 'group_unsubscribe', expectedUserMessage: 'Email sending update: Recipient unsubscribed' },
        { event: 'group_resubscribe', expectedUserMessage: 'Email sending update: Recipient resubscribed' },
      ])('logs informational communication for $event status without changing notification status', async ({ event, expectedUserMessage }) => {
        // Arrange
        const identity = await createIdentity()
        const input = await getDefaultPresentationFlowInput()
        input.identityId = identity.id
        input.contact = {
          notification: {
            method: ContactMethod.Email,
            value: casual.email,
          },
        }

        const result = await createPresentationFlow(input)
        const presentationFlowId = result.request.id

        // Get initial status
        const initialStatus = await inTransaction(async (entityManager) => {
          const presentationFlowRepository = entityManager.getRepository(PresentationFlowEntity)
          const presentationFlow = await presentationFlowRepository.findOneByOrFail({ id: presentationFlowId })
          return presentationFlow.notificationStatus
        })

        // Act
        await inTransaction(async (entityManager) => {
          await handlePresentationFlowEmailStatusCallback(
            presentationFlowId,
            {
              email: casual.email,
              timestamp: Date.now(),
              sgEventId: casual.uuid,
              sgMessageId: casual.uuid,
              event,
            },
            entityManager,
            logger,
          )
        }, SYSTEM_USER_ID)

        // Assert - notification status should remain unchanged but communication should be logged
        await inTransaction(async (entityManager) => {
          const presentationFlowRepository = entityManager.getRepository(PresentationFlowEntity)
          const presentationFlow = await presentationFlowRepository.findOneByOrFail({ id: presentationFlowId })
          expect(presentationFlow.notificationStatus).toBe(initialStatus)

          const communicationRepository = entityManager.getRepository(CommunicationEntity)
          const communications = await communicationRepository.find({
            where: { presentationFlowId },
          })
          expect(communications).toHaveLength(1)
          expect(communications[0]?.status).toBe(CommunicationStatus.Informational)
          expect(communications[0]?.details).toBe(expectedUserMessage)
          expect(communications[0]?.contactMethod).toBe(ContactMethod.Email)
          expect(communications[0]?.recipientId).toBe(identity.id)
        })
      })
    })
  })

  describe('callback URL helpers', () => {
    it('generates correct presentation flow email callback URL', () => {
      // Arrange
      const presentationFlowId = casual.uuid

      // Act
      const url = getPresentationFlowEmailStatusCallbackUrl(presentationFlowId)

      // Assert
      expect(url).toContain('/external/callback/email/presentation-flow/')
      expect(url).toContain(presentationFlowId)
    })
  })
})
