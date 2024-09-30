import { dataSource } from '../../../data'
import { AsyncIssuanceRequestExpiry, ContactMethod } from '../../../generated/graphql'
import { beforeAfterAll, expectResponseUnionToBe } from '../../../test'
import { executeJob } from '../../../test/background-job'
import { mockedServices } from '../../../test/mocks'
import { throwError } from '../../../util/throw-error'
import { createIdentity } from '../../identity/tests/create-identity'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { sendAsyncIssuanceNotificationsJobHandler } from '../jobs/send-async-issuance-notifications'
import { createIssuanceRequest } from './create-async-issuance'
import { getAsyncIssuance } from './get-async-issunace'
import { buildContact, givenContract } from './index'
import { resendAsyncIssuanceNotification } from './resend-async-issunace-notification'

describe('resendAsyncIssuanceNotification mutation', () => {
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
  describe('with valid input', () => {
    it.each<{
      type: string
      useEmail?: boolean
      useSms?: boolean
      useSingleFactor?: boolean
    }>([
      { type: 'single-factor resend email notification works', useEmail: true, useSingleFactor: true },
      { type: 'multi-factor resend email notification works', useEmail: true },
      { type: 'single-factor resend sms notification works', useSingleFactor: true },
      { type: 'multi-factor resend sms notification works' },
    ])('$type', async ({ useEmail, useSingleFactor }) => {
      // Arrange
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const contact = buildContact(useSingleFactor, useEmail ? ContactMethod.Email : ContactMethod.Sms)

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
      const asyncIssuance = (await getAsyncIssuance(requestId)) ?? throwError('Issuance not found')

      const asyncIssuanceRepo = dataSource.manager.getRepository(AsyncIssuanceEntity)
      let asyncIssuanceEntity = await asyncIssuanceRepo.findOneByOrFail({ id: requestId })
      expect(asyncIssuanceEntity.state).toBe('pending')

      await executeJob(sendAsyncIssuanceNotificationsJobHandler, {
        userId: asyncIssuance.createdBy.id,
        asyncIssuanceRequestIds: [requestId],
      })

      asyncIssuanceEntity = await asyncIssuanceRepo.findOneByOrFail({ id: requestId })
      expect(asyncIssuanceEntity.state).toBe('contacted')
      expect(mockedServices.communicationsService.sendIssuance.mock()).toHaveBeenCalledTimes(1)

      // Act
      await resendAsyncIssuanceNotification(requestId)

      // Assert
      expect(mockedServices.communicationsService.sendIssuance.mock()).toHaveBeenCalledTimes(2)
    })
  })
})
