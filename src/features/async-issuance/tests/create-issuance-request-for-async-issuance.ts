import { graphql } from '../../../generated'
import { executeOperationAsLimitedAsyncIssuanceClient, type LimitedPhotoCaptureOperationInput } from '../../../test'
import { resolveToType } from '../../../util/type-helpers'
import type { AsyncIssuanceSessionData } from '../../async-issuance/session'
import { validPhotoDataUrl } from '../../photo-capture/test'

export const createIssuanceRequestForAsyncIssuanceMutation = graphql(`
  mutation CreateIssuanceRequestForAsyncIssuance($asyncIssuanceRequestId: UUID!) {
    createIssuanceRequestForAsyncIssuance(asyncIssuanceRequestId: $asyncIssuanceRequestId) {
      ... on IssuanceResponse {
        __typename
        requestId
        url
        qrCode
        credentialRecordId
      }
      ... on RequestErrorResponse {
        __typename
        requestId
        date
        mscv
        error {
          code
          message
          innererror {
            code
            message
            target
          }
        }
      }
    }
  }
`)

export async function createIssuanceRequestForAsyncIssuance(
  asyncIssuanceRequestId: string,
  limitedAsyncIssuanceData: AsyncIssuanceSessionData,
) {
  const limitedPhotoCaptureData = limitedAsyncIssuanceData.photoCaptureRequestId
    ? resolveToType<LimitedPhotoCaptureOperationInput>({
        userId: limitedAsyncIssuanceData.userId,
        photo: validPhotoDataUrl,
        photoCaptureRequestId: limitedAsyncIssuanceData.photoCaptureRequestId,
        contractId: limitedAsyncIssuanceData.contractId,
        identityId: limitedAsyncIssuanceData.identityId,
      })
    : undefined

  const { data, errors } = await executeOperationAsLimitedAsyncIssuanceClient(
    {
      query: createIssuanceRequestForAsyncIssuanceMutation,
      variables: { asyncIssuanceRequestId },
    },
    limitedPhotoCaptureData,
    limitedAsyncIssuanceData,
  )

  if (errors) throw new Error(`Error while creating issuance request for the async issuance: ${JSON.stringify(errors)}`)
  if (!data) throw new Error('No data returned')

  return data.createIssuanceRequestForAsyncIssuance
}
