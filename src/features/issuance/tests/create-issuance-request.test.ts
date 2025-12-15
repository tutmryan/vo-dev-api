import { randomUUID } from 'crypto'
import {
  ClaimType,
  ContractDisplayClaimInput,
  ContractInput,
  FaceCheckPhotoSupport,
  type IssuanceRequestInput,
  type PhotoCaptureRequest,
} from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAsLimitedAccessClient } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { NonNullableFields, WithRequired } from '../../../util/type-helpers'
import { buildContractInput, createContract } from '../../contracts/test/create-contract'
import { provisionContract } from '../../contracts/test/provision-contract'
import { createIdentity } from '../../identity/tests/create-identity'
import { capturePhoto, createPhotoCaptureRequest } from '../../photo-capture/test'
import { convertFaceCheckPhoto, convertImageClaimInput } from '../commands/create-issuance-request-command'
import { createIssuanceRequest, createIssuanceRequestMutation } from './create-issuance'

const credentialType = 'issuance-test'
const externalContractId = randomUUID()
const faceCheckPhoto = 'data:image/jpeg;base64,ZmFjZS1jaGVjay1mYWNlY2hlY2twZWl4YW1wbGU='
const photoCapturePhoto = 'data:image/jpeg;base64,cGhvdG8tY2FwdHVyZS1waG90b2NhcHR1cmVleGFtcGxl='
const contractPhoto = 'data:image/jpeg;base64,Y29udHJhY3QtcGhvdG8tZXhhbXBsZWNvbnRyYWN0='
const inputPhoto = 'data:image/jpeg;base64,aW5wdXQtcGhvdG8tZXhhbXBsZWlucHV0='

async function givenContract({ faceCheckSupport }: { faceCheckSupport?: ContractInput['faceCheckSupport'] }) {
  const input = buildContractInput({
    templateId: null,
    faceCheckSupport,
    credentialTypes: [credentialType],
  })

  const contract = await createContract(input)

  await provisionContract(contract.id, externalContractId)

  return { contract }
}

async function givenContractWithClaims(claims: Array<ContractDisplayClaimInput>) {
  const contractInput = buildContractInput({
    display: {
      claims,
    },
    credentialTypes: [credentialType],
  })

  const contract = await createContract(contractInput)
  await provisionContract(contract.id, randomUUID())
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

function withMockedServices() {
  mockedServices.adminService.contract.resolvedWith(mockedServices.adminService.contract.buildResolve())
  mockedServices.adminService.authority.resolvedWith(mockedServices.adminService.authority.buildResolve())
  mockedServices.requestService.createIssuanceRequest.resolveWith(mockedServices.requestService.createIssuanceRequest.buildResolve())
  mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
    mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
  )
}

describe('createIssuanceRequest mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
  })
  it('works with valid input', async () => {
    // Arrange
    withMockedServices()
    const { contract } = await givenContract({})
    const identity = await createIdentity()

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
    withMockedServices()

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
    const issuanceRequest = mockedServices.requestService.createIssuanceRequest.getLastCallArg()
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
    const issuanceRequest = mockedServices.requestService.createIssuanceRequest.getLastCallArg()
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
    withMockedServices()
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
      withMockedServices()

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

  describe('claims handling', () => {
    beforeEach(() => {
      withMockedServices()
    })
    it.each([
      {
        description: 'overrides non-fixed claims with default values',
        contractClaims: [
          { label: 'text', claim: 'text', type: ClaimType.Text, value: 'defaultText', isFixed: false },
          { label: 'number', claim: 'number', type: ClaimType.Number, value: '30' },
        ],
        claimsInput: { text: 'Input text', number: '25' },
        expectedClaims: {
          text: 'Input text', // Overridden because it's not fixed
          number: '25', // Overridden because isFixed is undefined (treated as false)
        },
      },
      {
        description: 'does not override fixed claims',
        contractClaims: [
          { label: 'text', claim: 'text', type: ClaimType.Text, value: 'fixedValue', isFixed: true },
          { label: 'number', claim: 'number', type: ClaimType.Number, value: '30' },
        ],
        claimsInput: { text: 'Input Name', number: 25 },
        expectedClaims: {
          text: 'fixedValue', // Not overridden because it's fixed
          number: 25,
        },
      },
      {
        description: 'converts image claims to Base64Url for all contract defined images and claim input',
        contractClaims: [
          { label: 'default-photo', claim: 'default_photo', type: ClaimType.Image, value: contractPhoto, isFixed: true },
          { label: 'another-photo', claim: 'another_photo', type: ClaimType.Image, value: undefined, isFixed: false },
        ],
        claimsInput: { another_photo: inputPhoto },
        expectedClaims: {
          default_photo: convertImageClaimInput(contractPhoto, 'default_photo'),
          another_photo: convertImageClaimInput(inputPhoto, 'another_photo'),
        },
      },
    ])('$description', async ({ contractClaims, claimsInput, expectedClaims }) => {
      // Arrange
      const { contract } = await givenContractWithClaims(contractClaims)
      const identity = await createIdentity()

      // Act
      const { errors, data } = await executeOperationAsLimitedAccessClient(
        {
          query: createIssuanceRequestMutation,
          variables: {
            request: {
              contractId: contract.id,
              claims: claimsInput,
            },
          },
        },
        { identityId: identity.id, issuableContractIds: [contract.id] },
      )

      // Assert
      expect(errors).toBeUndefined()
      expect(data).toBeDefined()

      const issuanceRequest = mockedServices.requestService.createIssuanceRequest.getLastCallArg()
      expect(issuanceRequest.claims).toMatchObject(expectedClaims)
    })

    it.each([
      {
        description: 'should return an error when a claim input does not match the expected contract claim type',
        contractClaims: [{ label: 'age', claim: 'age', type: ClaimType.Number, value: '30', isFixed: false }],
        claimsInput: { age: 'NotANumber' },
        expectedError: '[Claim Type: number] Invalid input: expected number, received NaN',
      },
      {
        description: 'should return an error when required claims are missing',
        contractClaims: [
          { label: 'age', claim: 'age', type: ClaimType.Number, value: undefined, isOptional: false },
          { label: 'First Name', claim: 'firstName', type: ClaimType.Text, value: undefined, isOptional: false },
        ],
        claimsInput: { firstName: 'John' }, // Missing "age"
        expectedError: 'Claims must include: age',
      },
    ])('$description', async ({ contractClaims, claimsInput, expectedError }) => {
      // Arrange
      const { contract } = await givenContractWithClaims(contractClaims)
      const identity = await createIdentity()

      // Act
      const { errors, data } = await executeOperationAsLimitedAccessClient(
        {
          query: createIssuanceRequestMutation,
          variables: {
            request: {
              contractId: contract.id,
              claims: claimsInput,
            },
          },
        },
        { identityId: identity.id, issuableContractIds: [contract.id] },
      )

      // Assert
      expect(errors).toBeDefined()
      expect(errors?.length).toBeGreaterThan(0)
      expect(errors?.[0]?.message).toContain(expectedError)
      expect(data).toBeNull()
    })
  })
})
