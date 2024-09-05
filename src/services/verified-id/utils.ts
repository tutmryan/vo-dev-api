import { HttpResponseError } from '@makerx/node-common'
import type { RequestErrorResponse } from '../../generated/graphql'

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
