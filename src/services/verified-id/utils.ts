import { HttpResponseError } from '@makerx/node-common'

/***
 * The VID service generally returns a 400 error with a JSON body that contains a serialised error.
 * This error is much more useful as it will contain detailed info on the cause of the invalid request, e.g. missing claims, invalid combinations of values.
 * This function will throw the error from the response body if it exists, otherwise it will throw the original error.
 */
export function throwBestResponseErrorInfo(error: any): never {
  if (error instanceof HttpResponseError && error.responseInfo.responseJson)
    throw (error.responseInfo.responseJson as any).error ?? error.responseInfo.responseJson
  throw error
}
