import casual from 'casual'
import { AsyncIssuanceRequestExpiry, ContactMethod } from '../../generated/graphql'
import { beforeAfterAll, expectResponseUnionToBe, inTransaction } from '../../test'
import { mockedServices } from '../../test/mocks'
import { throwError } from '../../util/throw-error'
import { CommunicationEntity } from '../communication/entities/communication-entity'
import { createIdentity } from '../identity/tests/create-identity'
import { SYSTEM_USER_ID } from '../users/entities/user-entity'
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'
import {
  getIssuanceEmailStatusCallbackUrl,
  getVerificationEmailStatusCallbackUrl,
  handleEmailStatusCallback,
} from './email-status-callback'
import { createIssuanceRequest } from './tests/create-async-issuance'
import { buildContact, givenContract } from './tests/index'

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
        event: 'deferred' | 'bounce' | 'dropped'
        expectedUserMessage: string
      }>([
        {
          event: 'deferred',
          expectedUserMessage: 'Email sending failed: Message deferred (try again later)',
        },
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
          expect(communications[0]?.error).toBe(expectedUserMessage)
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
          expect(communications[0]?.error).toBe('Email sending failed: Mailbox unavailable')
        })
      })
    })

    describe('with success status', () => {
      it.each<{
        event: 'processed' | 'delivered' | 'open' | 'click' | 'spamreport' | 'unsubscribe' | 'group_unsubscribe' | 'group_resubscribe'
      }>([
        { event: 'processed' },
        { event: 'delivered' },
        { event: 'open' },
        { event: 'click' },
        { event: 'spamreport' },
        { event: 'unsubscribe' },
        { event: 'group_unsubscribe' },
        { event: 'group_resubscribe' },
      ])('does not update database for $event status', async ({ event }) => {
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
              smtpId: casual.uuid,
            },
            entityManager,
          )
        })

        // Assert - state should remain unchanged
        await inTransaction(async (entityManager) => {
          const asyncIssuanceRepository = entityManager.getRepository(AsyncIssuanceEntity)
          const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: requestId })
          expect(asyncIssuance.state).toBe(initialState)

          const communicationRepository = entityManager.getRepository(CommunicationEntity)
          const communications = await communicationRepository.find({
            where: { asyncIssuanceId: requestId },
          })
          expect(communications).toHaveLength(0)
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
