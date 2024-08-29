import { randomUUID } from 'crypto'
import { ContractInput, FaceCheckPhotoSupport, type IssuanceRequestInput, type PhotoCaptureRequest } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAsLimitedAccessClient } from '../../../test'
import { mockAdminServiceHelper, mockRequestServiceHelper } from '../../../test/mock-services'
import { NonNullableFields, WithRequired } from '../../../util/type-helpers'
import { buildContractInput, createContract } from '../../contracts/test/create-contract'
import { provisionContract } from '../../contracts/test/provision-contract'
import { createIdentity } from '../../identity/tests/create-identity'
import { capturePhoto, createPhotoCaptureRequest } from '../../photo-capture/test'
import { convertFaceCheckPhoto } from '../commands/create-issuance-request-command'
import { createIssuanceRequest, createIssuanceRequestMutation } from './create-issuance'

const credentialType = 'issuance-test'
const externalContractId = randomUUID()
const faceCheckPhoto = 'data:image/jpeg;base64,ZmFjZS1jaGVjay0xMjM='
const photoCapturePhoto = 'data:image/jpeg;base64,cGhvdG8tY2FwdHVyZS0xMjM='

async function givenContract({ faceCheckSupport }: { faceCheckSupport?: ContractInput['faceCheckSupport'] }) {
  const contract = await createContract(
    buildContractInput({
      templateId: null,
      faceCheckSupport,
      credentialTypes: [credentialType],
    }),
  )

  await provisionContract(contract.id, externalContractId)

  return { contract }
}

async function givenPhotoCapture(request: NonNullableFields<WithRequired<PhotoCaptureRequest, 'identityId'>>) {
  const { data, errors } = await createPhotoCaptureRequest(request)

  if (errors) {
    throw new Error(`Error while creating a contract: ${JSON.stringify(errors)}`)
  }

  const { errors: captureErrors } = await capturePhoto({
    photoCaptureRequestId: data!.createPhotoCaptureRequest.id,
    photo: photoCapturePhoto,
    contractId: request.contractId,
    identityId: request.identityId,
  })

  if (captureErrors) {
    throw new Error(`Error while capturing a photo: ${JSON.stringify(captureErrors)}`)
  }

  return data!.createPhotoCaptureRequest
}

function withMockedAdminService() {
  mockAdminServiceHelper.contract.resolvedWith(mockAdminServiceHelper.contract.buildResolve())
  mockAdminServiceHelper.authority.resolvedWith(mockAdminServiceHelper.authority.buildResolve())
  mockRequestServiceHelper.createIssuanceRequest.resolveWith(mockRequestServiceHelper.createIssuanceRequest.buildResolve())
}

describe('createIssuanceRequest mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockAdminServiceHelper.clearAllMocks()
    mockRequestServiceHelper.clearAllMocks()
  })
  it('works with valid input ', async () => {
    // Arrange
    const { contract } = await givenContract({})
    const identity = await createIdentity()
    withMockedAdminService()

    // Act
    const { errors, data } = await executeOperationAsLimitedAccessClient(
      {
        query: createIssuanceRequestMutation,
        variables: {
          request: {
            contractId: contract.id,
          },
        },
      },
      { identityId: identity.id, issuableContractIds: [contract.id] },
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()
  })
  it('works with face check when passing the photo', async () => {
    const { contract } = await givenContract({
      faceCheckSupport: FaceCheckPhotoSupport.Required,
    })
    const identity = await createIdentity()
    withMockedAdminService()

    // Act
    const { errors, data } = await executeOperationAsLimitedAccessClient(
      {
        query: createIssuanceRequestMutation,
        variables: {
          request: {
            contractId: contract.id,
            faceCheckPhoto,
          },
        },
      },
      { identityId: identity.id, issuableContractIds: [contract.id] },
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()

    // Assert the photo was passed to the issuance request
    const issuanceRequest = mockRequestServiceHelper.createIssuanceRequest.getLastCallArg()
    expect(issuanceRequest.claims!['photo']).toBe(convertFaceCheckPhoto(faceCheckPhoto))
  })
  it('works with face check when passing the photo capture request id', async () => {
    // Arrange
    const { contract } = await givenContract({
      faceCheckSupport: FaceCheckPhotoSupport.Required,
    })
    const identity = await createIdentity()
    const photoCaptureRequest = await givenPhotoCapture({
      contractId: contract.id,
      identityId: identity.id,
    })
    withMockedAdminService()

    // Act
    const { errors, data } = await executeOperationAsLimitedAccessClient(
      {
        query: createIssuanceRequestMutation,
        variables: {
          request: {
            contractId: contract.id,
            identityId: identity.id,
            photoCaptureRequestId: photoCaptureRequest.id,
          },
        },
      },
      { identityId: identity.id, issuableContractIds: [contract.id] },
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()

    // Assert the photo was passed to the issuance request
    const issuanceRequest = mockRequestServiceHelper.createIssuanceRequest.getLastCallArg()
    expect(issuanceRequest.claims!['photo']).toBe(convertFaceCheckPhoto(photoCapturePhoto))
  })
  it('fails with face check when passing a previously used photo capture request id', async () => {
    // Arrange
    const { contract } = await givenContract({
      faceCheckSupport: FaceCheckPhotoSupport.Required,
    })
    const identity = await createIdentity()
    const photoCaptureRequest = await givenPhotoCapture({
      contractId: contract.id,
      identityId: identity.id,
    })
    withMockedAdminService()
    await createIssuanceRequest(
      {
        contractId: contract.id,
        identityId: identity.id,
        photoCaptureRequestId: photoCaptureRequest.id,
      },
      { identityId: identity.id, issuableContractIds: [contract.id] },
    )

    // Act
    const { errors, data } = await executeOperationAsLimitedAccessClient(
      {
        query: createIssuanceRequestMutation,
        variables: {
          request: {
            contractId: contract.id,
            identityId: identity.id,
            photoCaptureRequestId: photoCaptureRequest.id,
          },
        },
      },
      { identityId: identity.id, issuableContractIds: [contract.id] },
    )

    // Assert
    expect(errors).toBeDefined()
    expect(data).toBeDefined()
  })
  describe('face check validation', () => {
    async function doValidationCheck(
      contractVariables: { faceCheckSupport?: ContractInput['faceCheckSupport'] },
      requestVariables: Omit<IssuanceRequestInput, 'contractId'>,
    ) {
      // Arrange
      const { contract } = await givenContract(contractVariables)
      const identity = await createIdentity()
      withMockedAdminService()

      // Act
      const { errors, data } = await executeOperationAsLimitedAccessClient(
        {
          query: createIssuanceRequestMutation,
          variables: {
            request: {
              contractId: contract.id,
              ...requestVariables,
            },
          },
        },
        { identityId: identity.id, issuableContractIds: [contract.id] },
      )

      // Assert
      expect(errors).toBeDefined()
      expect(errors?.length).toBeGreaterThan(0)
      expect(data).toBeFalsy()
    }
    it('fails when the contract specifies face check required and neither photo nor photo request id is provided', async () => {
      await doValidationCheck(
        {
          faceCheckSupport: FaceCheckPhotoSupport.Required,
        },
        {},
      )
    })
    it('fails when the contract specifies face check none and either photo or photo request id is provided', async () => {
      await doValidationCheck(
        {
          faceCheckSupport: FaceCheckPhotoSupport.None,
        },
        {
          faceCheckPhoto,
        },
      )
      await doValidationCheck(
        {
          faceCheckSupport: FaceCheckPhotoSupport.None,
        },
        {
          photoCaptureRequestId: randomUUID(),
        },
      )
    })
    it('fails when both a photo and a photo request id is provided', async () => {
      await doValidationCheck(
        {
          faceCheckSupport: FaceCheckPhotoSupport.Required,
        },
        {
          faceCheckPhoto,
          photoCaptureRequestId: randomUUID(),
        },
      )
    })
  })
})
