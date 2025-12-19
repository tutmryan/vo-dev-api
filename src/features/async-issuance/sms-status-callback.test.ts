import casual from 'casual'
import { AsyncIssuanceRequestExpiry, CommunicationStatus, ContactMethod } from '../../generated/graphql'
import { logger } from '../../logger'
import { beforeAfterAll, expectResponseUnionToBe, inTransaction } from '../../test'
import { mockedServices } from '../../test/mocks'
import { throwError } from '../../util/throw-error'
import { CommunicationEntity } from '../communication/entities/communication-entity'
import { createIdentity } from '../identity/tests/create-identity'
import { SYSTEM_USER_ID } from '../users/entities/user-entity'
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'
import { getIssuanceSmsStatusCallbackUrl, getVerificationSmsStatusCallbackUrl, handleSmsStatusCallback } from './sms-status-callback'
import { createAsyncIssuanceRequest } from './tests/create-async-issuance'
import { buildContact, givenContract } from './tests/index'

describe('SMS status callback', () => {
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

  describe('handleSmsStatusCallback', () => {
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
      ])('handles $messageStatus with error code $errorCode for issuance', async ({ messageStatus, errorCode, expectedUserMessage }) => {
        // Arrange
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const contact = buildContact(false, ContactMethod.Sms)
        const createResponse = await createAsyncIssuanceRequest([
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
          await handleSmsStatusCallback(
            'issuance',
            requestId,
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
          expect(communications[0]?.contactMethod).toBe(ContactMethod.Sms)
          expect(communications[0]?.recipientId).toBe(identity.id)
        })
      })

      it('marks async issuance as issuance-verification-failed for verification callback', async () => {
        // Arrange
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const contact = buildContact(false, ContactMethod.Sms)
        const createResponse = await createAsyncIssuanceRequest([
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
          await handleSmsStatusCallback(
            'verification',
            requestId,
            {
              messageStatus: 'failed',
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
          expect(communications[0]?.details).toBe('SMS sending failed: Unknown error')
        })
      })
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
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const contact = buildContact(false, ContactMethod.Sms)
        const createResponse = await createAsyncIssuanceRequest([
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
          await handleSmsStatusCallback(
            'issuance',
            requestId,
            {
              messageStatus,
            },
            entityManager,
            logger,
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
      const url = getIssuanceSmsStatusCallbackUrl(asyncIssuanceId)

      // Assert
      expect(url).toContain('/external/callback/sms/async-issuance/issuance/')
      expect(url).toContain(asyncIssuanceId)
    })

    it('generates correct verification callback URL', () => {
      // Arrange
      const asyncIssuanceId = casual.uuid

      // Act
      const url = getVerificationSmsStatusCallbackUrl(asyncIssuanceId)

      // Assert
      expect(url).toContain('/external/callback/sms/async-issuance/verification/')
      expect(url).toContain(asyncIssuanceId)
    })
  })
})
