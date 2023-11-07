import type { ClientCredentialsConfig, HttpClientOptions } from '@makerx/node-common'
import { HttpClient, HttpResponseError, getClientCredentialsToken } from '@makerx/node-common'
import { REQUEST_CACHE_TTL, requestCallbackCache } from '../cache'
import type { BaseContext } from '../context'
import type {
  Callback,
  IssuanceRequestInput,
  IssuanceRequestResponse,
  IssuanceResponse,
  PresentationRequestInput,
  PresentationRequestResponse,
  PresentationResponse,
  RequestErrorResponse,
} from '../generated/graphql'

type RequestServiceOptions = HttpClientOptions<BaseContext> & {
  issuanceCallbackUrl: string
  issuanceCallbackAuthConfig: ClientCredentialsConfig
  presentationCallbackUrl: string
  presentationCallbackAuthConfig: ClientCredentialsConfig
}

export type IssuanceRequest = Omit<IssuanceRequestInput, 'contractId' | 'identity' | 'identityId'> & {
  authority: string
  manifest: string
  registration: IssuanceRequestRegistration
  /***
   * The type field doesn't appear to be used by #MSFT lol
   * https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/issuance-request-api#issuance-request-payload
   * The verifiable credential type. Should match the type as defined in the verifiable credential manifest.
   */
  type: string
}

export interface IssuanceRequestRegistration {
  clientName: string
  logoUrl?: URL
  termsOfServiceUrl?: URL
}

export type PresentationRequest = Omit<PresentationRequestInput, 'requestedContracts' | 'identity' | 'identityId'> & {
  authority: string
}

export class RequestService extends HttpClient<BaseContext> {
  readonly issuanceCallbackUrl: string
  readonly issuanceCallbackAuthConfig: ClientCredentialsConfig
  readonly presentationCallbackUrl: string
  readonly presentationCallbackAuthConfig: ClientCredentialsConfig

  constructor({
    issuanceCallbackUrl,
    issuanceCallbackAuthConfig,
    presentationCallbackUrl,
    presentationCallbackAuthConfig,
    ...options
  }: RequestServiceOptions) {
    super(options)
    this.issuanceCallbackUrl = issuanceCallbackUrl
    this.issuanceCallbackAuthConfig = issuanceCallbackAuthConfig
    this.presentationCallbackUrl = presentationCallbackUrl
    this.presentationCallbackAuthConfig = presentationCallbackAuthConfig
  }

  async createIssuanceRequest(request: IssuanceRequest): Promise<IssuanceResponse | RequestErrorResponse> {
    // mint a token to allow the callback route to be securely invoked
    const callbackCredentials = await getClientCredentialsToken(this.issuanceCallbackAuthConfig)
    // build the callback payload with url, auth headers and state
    const callback: Callback = {
      url: this.issuanceCallbackUrl,
      state: request.callback?.state ?? '',
      headers: {
        authorization: `Bearer ${callbackCredentials.access_token}`,
      },
    }
    // build the payload, overriding the upstream callback
    const { callback: upstreamCallback, ...issuanceRequest } = request
    const payload: IssuanceRequest = {
      callback,
      ...issuanceRequest,
    }

    // send it
    let response: IssuanceRequestResponse
    try {
      response = await this.post<IssuanceRequestResponse>('createIssuanceRequest', { data: payload })
      // store a reference to the upstream callback by requestId
      if (request.callback) await requestCallbackCache.set(response.requestId, JSON.stringify(request.callback), { ttl: REQUEST_CACHE_TTL })
      else this.options.logger?.warn('No callback provided for issuance request')
      return response
    } catch (error) {
      // RequestErrorResponse is returned via a 400 + JSON body
      if (error instanceof HttpResponseError && error.responseInfo.responseJson)
        return error.responseInfo.responseJson as RequestErrorResponse
      throw error
    }
  }

  async createPresentationRequest(request: PresentationRequest): Promise<PresentationResponse | RequestErrorResponse> {
    // mint a token to allow the callback route to be securely invoked
    const callbackCredentials = await getClientCredentialsToken(this.issuanceCallbackAuthConfig)
    // build the callback payload with url, auth headers and state
    const callback: Callback = {
      url: this.presentationCallbackUrl,
      state: request.callback?.state ?? '',
      headers: {
        authorization: `Bearer ${callbackCredentials.access_token}`,
      },
    }
    // build the payload, overriding the upstream callback
    const { callback: upstreamCallback, ...issuanceRequest } = request
    const payload: PresentationRequest = {
      callback,
      ...issuanceRequest,
    }
    // send it
    let response: PresentationRequestResponse
    try {
      response = await this.post<PresentationRequestResponse>('createPresentationRequest', { data: payload })
      // store a reference to the upstream callback by requestId
      if (request.callback) await requestCallbackCache.set(response.requestId, JSON.stringify(request.callback), { ttl: REQUEST_CACHE_TTL })
      else this.options.logger?.warn('No callback provided for presentation request')
      return response
    } catch (error) {
      // RequestErrorResponse is returned via a 400 + JSON body
      if (error instanceof HttpResponseError && error.responseInfo.responseJson)
        return error.responseInfo.responseJson as RequestErrorResponse
      throw error
    }
  }
}
