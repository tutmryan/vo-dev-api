import casual from 'casual'
import { randomUUID } from 'crypto'
import { addDays, addMinutes } from 'date-fns'
import { AsyncIssuanceRequestExpiry, ClaimType, ContactMethod, FaceCheckPhotoSupport } from '../../../generated/graphql'
import { beforeAfterAll, expectResponseUnionToBe } from '../../../test'
import { executeJob } from '../../../test/background-job'
import { mockedServices } from '../../../test/mocks'
import { throwError } from '../../../util/throw-error'
import { createIdentity } from '../../identity/tests/create-identity'
import { sendAsyncIssuanceNotificationsJobHandler } from '../jobs/send-async-issuance-notifications'
import { createIssuanceRequest } from './create-async-issuance'
import { createIssuanceRequestForAsyncIssuance } from './create-issuance-request-for-async-issuance'
import { getAsyncIssuance } from './get-async-issunace'
import { additonalContractClaims, buildContact, faceCheckPhoto, givenContract, validAdditonalContractClaims } from './index'

describe('createIssuanceRequestForAsyncIssuance mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()

    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )

    mockedServices.adminService.contract.resolvedWith(mockedServices.adminService.contract.buildResolve())
    mockedServices.adminService.authority.resolvedWith(mockedServices.adminService.authority.buildResolve())
    mockedServices.requestService.createIssuanceRequest.resolveWith(mockedServices.requestService.createIssuanceRequest.buildResolve())

    mockedServices.asyncIssuanceService.downloadAsyncIssuance.resolveWithCallArgsResolver(
      mockedServices.asyncIssuanceService.uploadAsyncIssuance.previousAsyncIssuanceCallArgResolver(),
    )
  })
  describe('with valid input', () => {
    it.each<{
      type: string
      useNotificationMethod?: ContactMethod
      useVerificationMethod?: ContactMethod
      useSingleFactor?: boolean
      useFaceCheck?: boolean
      usePhotoCapture?: boolean
      useClaims?: boolean
      useAllClaimTypes?: boolean
      useExpiry?: boolean
    }>([
      { type: 'multi-factor over email/sms works' },
      { type: 'multi-factor over sms/email works', useNotificationMethod: ContactMethod.Sms, useVerificationMethod: ContactMethod.Email },
      { type: 'single-factor over email works', useSingleFactor: true },
      { type: 'single-factor over sms works', useNotificationMethod: ContactMethod.Sms, useSingleFactor: true },
      { type: 'using face check works', useFaceCheck: true },
      { type: 'using photo capture works', usePhotoCapture: true },
      { type: 'using claims works', useClaims: true },
      { type: 'using all claims types works', useClaims: true, useAllClaimTypes: true },
      { type: 'using expiry works', useExpiry: true },
    ])(
      '$type',
      async ({
        useNotificationMethod = ContactMethod.Email,
        useVerificationMethod = ContactMethod.Sms,
        useSingleFactor,
        useFaceCheck,
        usePhotoCapture,
        useClaims,
        useAllClaimTypes,
        useExpiry,
      }) => {
        // Arrange
        const { contract } = await givenContract({
          faceCheckSupport: useFaceCheck || usePhotoCapture ? FaceCheckPhotoSupport.Required : undefined,
          claims: useClaims
            ? [
                { claim: 'fixed-claim', label: 'fixed-label', type: ClaimType.String, value: 'fixed-value' },
                { claim: 'unfixed-claim', label: 'unfixed-label', type: ClaimType.String, value: undefined },
                ...(useAllClaimTypes ? additonalContractClaims : []),
              ]
            : undefined,
        })
        const identity = await createIdentity()
        const contact = buildContact(useSingleFactor, useNotificationMethod, useVerificationMethod)

        const createResponse = await createIssuanceRequest([
          {
            contractId: contract.id,
            identityId: identity.id,
            expiry: AsyncIssuanceRequestExpiry.OneDay,
            contact,
            faceCheckPhoto: useFaceCheck ? faceCheckPhoto : undefined,
            photoCapture: usePhotoCapture ? true : undefined,
            claims: useClaims
              ? {
                  'unfixed-claim': casual.word,
                  ...(useAllClaimTypes ? validAdditonalContractClaims : {}),
                }
              : undefined,
            expirationDate: useExpiry ? addDays(addMinutes(new Date(), 1), 1) : undefined,
          },
        ])
        expectResponseUnionToBe(createResponse, 'AsyncIssuanceResponse')
        const requestId = createResponse.asyncIssuanceRequestIds[0] ?? throwError('Request not created')
        const asyncIssuance = (await getAsyncIssuance(requestId)) ?? throwError('Issuance not found')

        await executeJob(sendAsyncIssuanceNotificationsJobHandler, {
          userId: asyncIssuance.createdBy.id,
          asyncIssuanceRequestIds: [requestId],
        })

        // Act
        const createIssuanceResponse = await createIssuanceRequestForAsyncIssuance(requestId, {
          contractId: contract.id,
          identityId: identity.id,
          asyncIssuanceRequestId: requestId,
          userId: asyncIssuance.createdBy.id,
          photoCaptureRequestId: usePhotoCapture ? randomUUID() : undefined,
        })

        // Assert
        expectResponseUnionToBe(createIssuanceResponse, 'IssuanceResponse')
        expect(createIssuanceResponse.url).toBeDefined()
      },
    )
  })
})
