import { HttpResponseError } from '@makerx/node-common'
import type { RequestErrorResponse } from '../../generated/graphql'
import { invariant } from '../../util/invariant'
import { getObjectSizeInBytes } from '../../util/object-size'

export function throwBestResponseErrorInfo(error: any): never {
  const bestError = findBestResponseErrorInfo(error)
  throw bestError
}

/***
 * The VID service generally returns a 400 error with a JSON body that contains a serialised error.
 * This error is much more useful as it will contain detailed info on the cause of the invalid request, e.g. missing claims, invalid combinations of values.
 * This function will return the error from the response body if it exists, or the original error argument.
 */
export function findBestResponseErrorInfo(error: any): RequestErrorResponse | any {
  if (error instanceof HttpResponseError && error.responseInfo.responseJson) {
    const response: any = error.responseInfo.responseJson
    if ('error' in response) return response as RequestErrorResponse
    return response
  }
  return error
}

/***
 * The VID service returns a 400: Bad Request error with a request JSON body that exceeds 1MB.
 * This function will throw an error if the request body exceeds the limit, with a proper error message.
 * Generally useful for validating a issuance request body before sending it to the VID service.
 * DOC: https://learn.microsoft.com/en-us/entra/verified-id/verifiable-credentials-faq#what-are-the-size-limitations-for-a-verifiable-credential-in-verified-id
 */
export const maxIsssuanceRequestSize = 1048576 // in bytes
export function validateIssuanceRequestBodySize(request: object): void {
  const requestSizeInBytes = getObjectSizeInBytes(request)
  invariant(requestSizeInBytes <= maxIsssuanceRequestSize, 'Issuance request payload size exceeds the limit of 1 MB')
}
