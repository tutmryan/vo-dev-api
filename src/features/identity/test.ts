import { AsyncIssuanceRequestExpiry } from '../../generated/graphql'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsCredentialAdmin,
  expectToBeDefinedAndNotNull,
  expectToBeUndefined,
  expectUnauthorizedError,
} from '../../test'
import { mockedServices } from '../../test/mocks'
import { buildContact, executeCreateAsyncIssuanceRequestAsIssuer, givenContract } from '../async-issuance/tests'
import {
  createIdentity,
  createIdentityInput,
  deleteIdentities,
  deleteIdentitiesMutation,
  saveIdentityMutation,
} from './tests/create-identity'

function withMockedServices() {
  mockedServices.adminService.contract.resolvedWith(mockedServices.adminService.contract.buildResolve())
  mockedServices.adminService.authority.resolvedWith(mockedServices.adminService.authority.buildResolve())
  mockedServices.requestService.createIssuanceRequest.resolveWith(mockedServices.requestService.createIssuanceRequest.buildResolve())
  mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
    mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
  )
}
describe('Identity', () => {
  describe('saveIdentity query', () => {
    beforeAfterAll()
    it('returns a Identity and no errors when called as credential admin', async () => {
      const identity = await createIdentity()
      expectToBeDefinedAndNotNull(identity.id)
    })

    it('updates an identity when a different name is provided for the same identity', async () => {
      const initialIdentity = await createIdentity()
      expectToBeDefinedAndNotNull(initialIdentity.id)

      const updatedIdentity = await createIdentity({
        name: 'updated name',
        identifier: initialIdentity.identifier,
        issuer: initialIdentity.issuer,
      })
      expect(updatedIdentity.id).toBe(initialIdentity.id)
      expect(updatedIdentity.name).toBe('updated name')
    })
  })

  describe('deleteIdentities query', () => {
    beforeAfterAll()
    it('returns no errors when called as credential admin', async () => {
      const identity = await createIdentity()
      expectToBeDefinedAndNotNull(identity.id)
      await deleteIdentities([identity.id])
    })

    it('deletes multiple identities successfully', async () => {
      const identity1 = await createIdentity()
      const identity2 = await createIdentity()
      expectToBeDefinedAndNotNull(identity1.id)
      expectToBeDefinedAndNotNull(identity2.id)
      await deleteIdentities([identity1.id, identity2.id])
    })

    it('handles duplicated input values', async () => {
      const identity = await createIdentity()
      expectToBeDefinedAndNotNull(identity.id)
      await deleteIdentities([identity.id, identity.id, identity.id, identity.id]) //Duplicate input
    })

    it('throws error when trying to delete some identities which are in use', async () => {
      withMockedServices()
      const { contract } = await givenContract({})
      const usedIdentity = await createIdentity()
      const identity2 = await createIdentity()

      // Set up the async issuance request for identityInUse
      const asyncIssuanceRequestInput = {
        contractId: contract.id,
        identityId: usedIdentity.id,
        expiry: AsyncIssuanceRequestExpiry.OneDay,
        contact: buildContact(),
      }

      const { errors, data } = await executeCreateAsyncIssuanceRequestAsIssuer([asyncIssuanceRequestInput])
      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)

      const { data: deleteData, errors: deleteErrors } = await executeOperationAsCredentialAdmin({
        query: deleteIdentitiesMutation,
        variables: {
          ids: [identity2.id, usedIdentity.id],
        },
      })

      expect(deleteData?.deleteIdentities).toBeNull()
      expect(deleteErrors).toBeDefined()
      expect(deleteErrors).toHaveLength(1)
      expect(deleteErrors![0]!.message).toContain(`${usedIdentity.id} cannot be deleted`)
    })

    it('throws an error when input is non-existent identity', async () => {
      const nonExistentId = '28733cbd-1285-49b7-a8e6-570063e37559' // random generated

      const { data, errors } = await executeOperationAsCredentialAdmin({
        query: deleteIdentitiesMutation,
        variables: {
          ids: [nonExistentId],
        },
      })

      expect(data?.deleteIdentities).toBeNull()
      expect(errors).toBeDefined()
      expect(errors).toHaveLength(1)
      expect(errors![0]!.message).toBe(`Could not find identities: ${nonExistentId}`)
    })

    it('throws an error when attempting to to use non UUIDs', async () => {
      const notUUID = '12345'

      const { data, errors } = await executeOperationAsCredentialAdmin({
        query: deleteIdentitiesMutation,
        variables: {
          ids: [notUUID],
        },
      })

      expect(data?.deleteIdentities).toBeNull()
      expect(errors).toBeDefined()
      expect(errors).toHaveLength(1)
      expect(errors![0]!.message).toContain('Value is not a valid UUID')
    })
  })

  describe('unauthorized operations', () => {
    beforeAfterAll()

    it('should not allow anonymous users to call saveIdentity', async () => {
      const { data, errors } = await executeOperationAnonymous({
        query: saveIdentityMutation,
        variables: {
          input: createIdentityInput(),
        },
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('should not allow anonymous users to call deleteIdentities', async () => {
      const identity = await createIdentity()
      expectToBeDefinedAndNotNull(identity.id)

      const { data, errors } = await executeOperationAnonymous({
        query: deleteIdentitiesMutation,
        variables: {
          ids: [identity.id],
        },
      })

      expect(data?.deleteIdentities).toBeNull()
      expectUnauthorizedError(errors)
    })
  })
})
