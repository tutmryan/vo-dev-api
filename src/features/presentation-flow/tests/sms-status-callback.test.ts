import casual from 'casual'
import { CommunicationStatus, ContactMethod } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { beforeAfterAll, inTransaction } from '../../../test'
import { CommunicationEntity } from '../../communication/entities/communication-entity'
import { createIdentity } from '../../identity/tests/create-identity'
import { SYSTEM_USER_ID } from '../../users/entities/user-entity'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { getPresentationFlowSmsStatusCallbackUrl, handlePresentationFlowSmsStatusCallback } from '../sms-status-callback'
import { createPresentationFlow, getDefaultPresentationFlowInput } from '../tests/helpers'

describe('SMS status callback', () => {
  beforeAfterAll()

  describe('handlePresentationFlowSmsStatusCallback', () => {
    describe('with error status', () => {
      it.each<{
        messageStatus: 'failed' | 'undelivered' | 'canceled'
        errorCode?: string
        expectedUserMessage: string
      }>([
        {
          messageStatus: 'failed',
          expectedUserMessage: 'SMS sending failed: Unknown error',
        },
        {
          messageStatus: 'undelivered',
          expectedUserMessage: 'SMS sending failed: Could not be delivered',
        },
        {
          messageStatus: 'canceled',
          expectedUserMessage: 'SMS sending failed: Sending was canceled',
        },
        {
          messageStatus: 'failed',
          errorCode: '30004',
          expectedUserMessage: 'SMS sending failed: Message blocked',
        },
      ])(
        'handles $messageStatus with error code $errorCode for presentation flow',
        async ({ messageStatus, errorCode, expectedUserMessage }) => {
          // Arrange
          const identity = await createIdentity()
          const input = await getDefaultPresentationFlowInput()
          input.identityId = identity.id
          input.contact = {
            notification: {
              method: ContactMethod.Sms,
              value: casual.phone,
            },
          }

          const result = await createPresentationFlow(input)
          const presentationFlowId = result.request.id

          // Act
          await inTransaction(async (entityManager) => {
            await handlePresentationFlowSmsStatusCallback(
              presentationFlowId,
              {
                messageStatus,
                errorCode,
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
            expect(communications[0]?.contactMethod).toBe(ContactMethod.Sms)
            expect(communications[0]?.recipientId).toBe(identity.id)
          })
        },
      )
    })

    describe('with success status', () => {
      it.each<{ messageStatus: 'queued' | 'sending' | 'sent' | 'delivered' | 'accepted' | 'scheduled' | 'received' }>([
        { messageStatus: 'queued' },
        { messageStatus: 'sending' },
        { messageStatus: 'sent' },
        { messageStatus: 'delivered' },
        { messageStatus: 'accepted' },
        { messageStatus: 'scheduled' },
        { messageStatus: 'received' },
      ])('does not update database for $messageStatus status', async ({ messageStatus }) => {
        // Arrange
        const identity = await createIdentity()
        const input = await getDefaultPresentationFlowInput()
        input.identityId = identity.id
        input.contact = {
          notification: {
            method: ContactMethod.Sms,
            value: casual.phone,
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
          await handlePresentationFlowSmsStatusCallback(
            presentationFlowId,
            {
              messageStatus,
            },
            entityManager,
            logger,
          )
        }, SYSTEM_USER_ID)

        // Assert - notification status should remain unchanged and no communication should be logged
        await inTransaction(async (entityManager) => {
          const presentationFlowRepository = entityManager.getRepository(PresentationFlowEntity)
          const presentationFlow = await presentationFlowRepository.findOneByOrFail({ id: presentationFlowId })
          expect(presentationFlow.notificationStatus).toBe(initialStatus)

          const communicationRepository = entityManager.getRepository(CommunicationEntity)
          const communications = await communicationRepository.find({
            where: { presentationFlowId },
          })
          expect(communications).toHaveLength(0)
        })
      })
    })
  })

  describe('callback URL helpers', () => {
    it('generates correct presentation flow SMS callback URL', () => {
      // Arrange
      const presentationFlowId = casual.uuid

      // Act
      const url = getPresentationFlowSmsStatusCallbackUrl(presentationFlowId)

      // Assert
      expect(url).toContain('/external/callback/sms/presentation-flow/')
      expect(url).toContain(presentationFlowId)
    })
  })
})
