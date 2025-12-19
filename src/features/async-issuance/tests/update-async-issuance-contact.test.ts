import { AsyncIssuanceRequestExpiry, ContactMethod } from '../../../generated/graphql'
import { beforeAfterAll, expectResponseUnionToBe } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { throwError } from '../../../util/throw-error'
import { createIdentity } from '../../identity/tests/create-identity'
import { createAsyncIssuanceRequest } from './create-async-issuance'
import { buildContact, givenContract } from './index'
import { updateAsyncIssuanceContact } from './update-async-issuance-contact'

describe('updateAsyncIssuanceContact mutation', () => {
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
      useSingleFactor?: boolean
    }>([{ type: 'multi-factor works' }, { type: 'single-factor works', useSingleFactor: true }])('$type', async ({ useSingleFactor }) => {
      // Arrange
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const contact = buildContact(useSingleFactor, ContactMethod.Email)
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
      expect(mockedServices.asyncIssuanceService.uploadAsyncIssuance.mock()).toHaveBeenCalledTimes(1)

      let callData = mockedServices.asyncIssuanceService.uploadAsyncIssuance.mock().mock.lastCall![1]
      expect(callData?.contact).toEqual(contact)

      // Act
      const updatedContact = buildContact(useSingleFactor, ContactMethod.Sms)
      await updateAsyncIssuanceContact(requestId, updatedContact)

      // Assert
      callData = mockedServices.asyncIssuanceService.uploadAsyncIssuance.mock().mock.lastCall![1]
      expect(callData?.contact).toEqual(updatedContact)
    })
  })
})
