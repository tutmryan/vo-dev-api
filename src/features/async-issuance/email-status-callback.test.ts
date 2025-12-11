import casual from 'casual'
import { AsyncIssuanceRequestExpiry, CommunicationStatus, ContactMethod } from '../../generated/graphql'
import { beforeAfterAll, expectResponseUnionToBe, inTransaction } from '../../test'
import { mockedServices } from '../../test/mocks'
import { throwError } from '../../util/throw-error'
import { CommunicationEntity } from '../communication/entities/communication-entity'
import { createIdentity } from '../identity/tests/create-identity'
import { SYSTEM_USER_ID } from '../users/entities/user-entity'
import {
  getIssuanceEmailStatusCallbackUrl,
  getVerificationEmailStatusCallbackUrl,
  handleEmailStatusCallback,
} from './email-status-callback'
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'
import { createIssuanceRequest } from './tests/create-async-issuance'
import { buildContact, givenContract } from './tests/index'
import { logger } from '../../logger'

describe('Email status callback', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
    mockedServices.asyncIssuanceService.downloadAsyncIssuance.resolveWithCallArgsResolver(
      mockedServices.asyncIssuanceService.uploadAsyncIssuance.previousAsyncIssuanceCallArgResolver(),
    )
  })

  describe('handleEmailStatusCallback', () => {
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
      ])('handles $event for issuance', async ({ event, expectedUserMessage }) => {
        // Arrange
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const contact = buildContact(false, ContactMethod.Email)
        const createResponse = await createIssuanceRequest([
          {
            contractId: contract.id,
            identityId: identity.id,
            expiry: AsyncIssuanceRequestExpiry.OneDay,
            contact,
          },
        ])
        expectResponseUnionToBe(createResponse, 'AsyncIssuanceResponse')
        const requestId = createResponse.asyncIssuanceRequestIds[0] ?? throwError('Request not created')

        // Act
        await inTransaction(async (entityManager) => {
          await handleEmailStatusCallback(
            'issuance',
            requestId,
            {
              email: 'test@example.com',
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
          const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
          const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: requestId })
          expect(asyncIssuance.state).toBe('contact-failed')

          const communicationRepository = entityManager.getRepository(CommunicationEntity)
          const communications = await communicationRepository.find({
            where: { asyncIssuanceId: requestId },
          })
          expect(communications).toHaveLength(1)
          expect(communications[0]?.status).toBe(CommunicationStatus.Failed)
          expect(communications[0]?.details).toBe(expectedUserMessage)
          expect(communications[0]?.contactMethod).toBe(ContactMethod.Email)
          expect(communications[0]?.recipientId).toBe(identity.id)
        })
      })

      it('marks async issuance as issuance-verification-failed for verification callback', async () => {
        // Arrange
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const contact = buildContact(false, ContactMethod.Email)
        const createResponse = await createIssuanceRequest([
          {
            contractId: contract.id,
            identityId: identity.id,
            expiry: AsyncIssuanceRequestExpiry.OneDay,
            contact,
          },
        ])
        expectResponseUnionToBe(createResponse, 'AsyncIssuanceResponse')
        const requestId = createResponse.asyncIssuanceRequestIds[0] ?? throwError('Request not created')

        // Act
        await inTransaction(async (entityManager) => {
          await handleEmailStatusCallback(
            'verification',
            requestId,
            {
              email: 'test@example.com',
              timestamp: Date.now(),
              sgEventId: casual.uuid,
              sgMessageId: casual.uuid,
              event: 'bounce',
              smtpId: casual.uuid,
            },
            entityManager,
            logger,
          )
        }, SYSTEM_USER_ID)

        // Assert
        await inTransaction(async (entityManager) => {
          const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
          const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: requestId })
          expect(asyncIssuance.state).toBe('issuance-verification-failed')

          const communicationRepository = entityManager.getRepository(CommunicationEntity)
          const communications = await communicationRepository.find({
            where: { asyncIssuanceId: requestId },
          })
          expect(communications).toHaveLength(1)
          expect(communications[0]?.status).toBe(CommunicationStatus.Failed)
          expect(communications[0]?.details).toBe('Email sending failed: Mailbox unavailable')
        })
      })
    })

    describe('with deferred status', () => {
      it('logs informational communication without failing issuance', async () => {
        // Arrange
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const contact = buildContact(false, ContactMethod.Email)
        const createResponse = await createIssuanceRequest([
          {
            contractId: contract.id,
            identityId: identity.id,
            expiry: AsyncIssuanceRequestExpiry.OneDay,
            contact,
          },
        ])
        expectResponseUnionToBe(createResponse, 'AsyncIssuanceResponse')
        const requestId = createResponse.asyncIssuanceRequestIds[0] ?? throwError('Request not created')

        // Get initial state
        const initialState = await inTransaction(async (entityManager) => {
          const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
          const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: requestId })
          return asyncIssuance.state
        })

        // Act
        await inTransaction(async (entityManager) => {
          await handleEmailStatusCallback(
            'issuance',
            requestId,
            {
              email: 'test@example.com',
              timestamp: Date.now(),
              sgEventId: casual.uuid,
              sgMessageId: casual.uuid,
              event: 'deferred',
              smtpId: casual.uuid,
            },
            entityManager,
            logger,
          )
        }, SYSTEM_USER_ID)

        // Assert - state should remain unchanged but communication should be logged
        await inTransaction(async (entityManager) => {
          const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
          const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: requestId })
          expect(asyncIssuance.state).toBe(initialState)

          const communicationRepository = entityManager.getRepository(CommunicationEntity)
          const communications = await communicationRepository.find({
            where: { asyncIssuanceId: requestId },
          })
          expect(communications).toHaveLength(1)
          expect(communications[0]?.status).toBe(CommunicationStatus.Informational)
          expect(communications[0]?.details).toBe('Email sending failed: Message deferred (try again later)')
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
      ])('logs informational communication for $event status without changing state', async ({ event, expectedUserMessage }) => {
        // Arrange
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const contact = buildContact(false, ContactMethod.Email)
        const createResponse = await createIssuanceRequest([
          {
            contractId: contract.id,
            identityId: identity.id,
            expiry: AsyncIssuanceRequestExpiry.OneDay,
            contact,
          },
        ])
        expectResponseUnionToBe(createResponse, 'AsyncIssuanceResponse')
        const requestId = createResponse.asyncIssuanceRequestIds[0] ?? throwError('Request not created')

        // Get initial state
        const initialState = await inTransaction(async (entityManager) => {
          const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
          const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: requestId })
          return asyncIssuance.state
        })

        // Act
        await inTransaction(async (entityManager) => {
          await handleEmailStatusCallback(
            'issuance',
            requestId,
            {
              email: 'test@example.com',
              timestamp: Date.now(),
              sgEventId: casual.uuid,
              sgMessageId: casual.uuid,
              event,
            },
            entityManager,
            logger,
          )
        })

        // Assert - state should remain unchanged but communication should be logged
        await inTransaction(async (entityManager) => {
          const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
          const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: requestId })
          expect(asyncIssuance.state).toBe(initialState)

          const communicationRepository = entityManager.getRepository(CommunicationEntity)
          const communications = await communicationRepository.find({
            where: { asyncIssuanceId: requestId },
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
    it('generates correct issuance callback URL', () => {
      // Arrange
      const asyncIssuanceId = casual.uuid

      // Act
      const url = getIssuanceEmailStatusCallbackUrl(asyncIssuanceId)

      // Assert
      expect(url).toContain('/external/callback/email/async-issuance/issuance/')
      expect(url).toContain(asyncIssuanceId)
    })

    it('generates correct verification callback URL', () => {
      // Arrange
      const asyncIssuanceId = casual.uuid

      // Act
      const url = getVerificationEmailStatusCallbackUrl(asyncIssuanceId)

      // Assert
      expect(url).toContain('/external/callback/email/async-issuance/verification/')
      expect(url).toContain(asyncIssuanceId)
    })
  })
})
