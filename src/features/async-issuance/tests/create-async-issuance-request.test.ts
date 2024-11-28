import casual from 'casual'
import { addDays, addMinutes } from 'date-fns'
import { AsyncIssuanceRequestExpiry, ClaimType, FaceCheckPhotoSupport } from '../../../generated/graphql'
import { beforeAfterAll, expectResponseUnionToBe, expectToBeDefinedAndNotNull, expectToBeUndefined } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { throwError } from '../../../util/throw-error'
import { createIdentity } from '../../identity/tests/create-identity'
import {
  additonalContractClaims,
  buildContact,
  executeCreateAsyncIssuanceRequestAsIssuer,
  faceCheckPhoto,
  givenContract,
  validAdditonalClaimsInput,
} from './index'

describe('createAsyncIssuanceRequest mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  describe('with valid input', () => {
    it.each<{
      type: string
      numberOfRequests?: number
      useSingleFactor?: boolean
      useFaceCheck?: boolean
      usePhotoCapture?: boolean
      useClaims?: boolean
      useExpiry?: boolean
      useAdditionalClaims?: boolean
      useAllClaimTypes?: boolean
    }>([
      { type: 'single issuance works', numberOfRequests: 1 },
      { type: 'multiple issuances works' },
      { type: 'issuance single-factor works', useSingleFactor: true },
      { type: 'issuance photo capture works', usePhotoCapture: true },
      { type: 'issuance face check works', useFaceCheck: true },
      { type: 'issuance with claims works', useClaims: true },
      { type: 'issuance with additional claims works', useClaims: true, useAdditionalClaims: true },
      { type: 'issuance with all different claims types works', useClaims: true, useAllClaimTypes: true },
      { type: 'issuance with expiry works', useExpiry: true },
    ])(
      '$type',
      async ({
        numberOfRequests = 2,
        useSingleFactor,
        useFaceCheck,
        usePhotoCapture,
        useClaims,
        useExpiry,
        useAdditionalClaims,
        useAllClaimTypes,
      }) => {
        // Arrange
        const { contract } = await givenContract({
          faceCheckSupport: useFaceCheck || usePhotoCapture ? FaceCheckPhotoSupport.Required : undefined,
          claims: useClaims
            ? [
                { claim: 'default-value-claim', label: 'default-value-label', type: ClaimType.Text, value: 'default-value-value' },
                { claim: 'no-default-value-claim', label: 'no-default-value-label', type: ClaimType.Text, value: undefined },
                ...(useAllClaimTypes ? additonalContractClaims : []),
              ]
            : undefined,
        })
        const identity = await Promise.all(new Array(numberOfRequests).fill(null).map(() => createIdentity()))

        // Act
        const { errors, data } = await executeCreateAsyncIssuanceRequestAsIssuer(
          new Array(numberOfRequests).fill(null).map((_, i) => ({
            contractId: contract.id,
            identityId: identity[i]?.id ?? throwError('Identity not created'),
            expiry: AsyncIssuanceRequestExpiry.OneDay,
            contact: buildContact(useSingleFactor),
            faceCheckPhoto: useFaceCheck ? faceCheckPhoto : undefined,
            photoCapture: usePhotoCapture ? true : undefined,
            claims: useClaims
              ? {
                  'no-default-value-claim': casual.word,
                  ...(useAdditionalClaims ? { random: 'claim' } : {}),
                  ...(useAllClaimTypes ? validAdditonalClaimsInput : {}),
                }
              : undefined,
            expirationDate: useExpiry ? addDays(addMinutes(new Date(), 1), 1) : undefined,
          })),
        )

        // Assert
        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        expectResponseUnionToBe(data.createAsyncIssuanceRequest, 'AsyncIssuanceResponse')
        expect(data.createAsyncIssuanceRequest.asyncIssuanceRequestIds).toHaveLength(numberOfRequests)
      },
    )
  })
  describe('with invalid input', () => {
    it.each<{
      type: string
      numberOfRequests?: number
      useInvalidExpiry?: boolean
      useMissedRequiredClaim?: boolean
      useInvalidClaim?: boolean
      useMissingFaceCheck?: boolean
      useMissingPhotoCapture?: boolean
      useBothFaceCheckAndPhotoCapture?: boolean
    }>([
      { type: 'issuance with invalid expiry fails', useInvalidExpiry: true },
      { type: 'issuance with required claim fails', useMissedRequiredClaim: true },
      { type: 'issuance with invalid claim fails', useInvalidClaim: true },
      { type: 'issuance with missing required face check fails', useMissingFaceCheck: true },
      { type: 'issuance with missing required photo capture check fails', useMissingPhotoCapture: true },
      { type: 'issuance with both face check and photo capture fails', useBothFaceCheckAndPhotoCapture: true },
    ])(
      '$type',
      async ({
        numberOfRequests = 2,
        useInvalidExpiry,
        useMissedRequiredClaim,
        useInvalidClaim: useInvalidClaimValue,
        useMissingFaceCheck,
        useMissingPhotoCapture,
        useBothFaceCheckAndPhotoCapture,
      }) => {
        // Arrange
        const { contract } = await givenContract({
          faceCheckSupport: useMissingFaceCheck || useMissingPhotoCapture ? FaceCheckPhotoSupport.Required : undefined,
          claims: [
            ...(useMissedRequiredClaim
              ? [{ claim: 'no-default-value-claim', label: 'no-default-value-label', type: ClaimType.Text, value: undefined }]
              : []),
            ...(useInvalidClaimValue
              ? [
                  {
                    claim: 'no-default-value-number-claim',
                    label: 'no-default-value-number-label',
                    type: ClaimType.Number,
                    value: undefined,
                    isOptional: false,
                  },
                ]
              : []),
          ],
        })
        const identity = await Promise.all(new Array(numberOfRequests).fill(null).map(() => createIdentity()))

        // Act
        const { errors, data } = await executeCreateAsyncIssuanceRequestAsIssuer(
          new Array(numberOfRequests).fill(null).map((_, i) => ({
            contractId: contract.id,
            identityId: identity[i]?.id ?? throwError('Identity not created'),
            expiry: AsyncIssuanceRequestExpiry.OneDay,
            expirationDate: useInvalidExpiry ? new Date() : undefined,
            contact: buildContact(),
            claims: useMissedRequiredClaim ? {} : useInvalidClaimValue ? { 'no-default-value-number-claim': 'abc' } : undefined,
            faceCheckPhoto: useBothFaceCheckAndPhotoCapture ? faceCheckPhoto : undefined,
            photoCapture: useBothFaceCheckAndPhotoCapture ? true : undefined,
          })),
        )

        // Assert
        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        expectResponseUnionToBe(data.createAsyncIssuanceRequest, 'AsyncIssuanceErrorResponse')
        expect(data.createAsyncIssuanceRequest.errors).toHaveLength(numberOfRequests)
      },
    )
  })
})
