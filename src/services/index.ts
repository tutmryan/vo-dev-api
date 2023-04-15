import type { HttpAuthFactory } from '@makerxstudio/node-common'
import {
  createClientCredentialsAuthFactory as clientCredentialsAuth,
  createOnBehalfOfAuthFactory as oboAuth,
} from '@makerxstudio/node-common'
import config from '../config'
import type { BaseContext } from '../context'
import { AdminService } from './admin'
import { B2cUserService } from './b2c-user'
import { NetworkService } from './network'
import { RequestService } from './request'

export * from './b2c-user'
export * from './network'

export interface Services {
  network: NetworkService
  b2cUser: B2cUserService
  admin: AdminService
  request: RequestService
}

export const createServices = (context: BaseContext): Services => {
  return {
    network: createNetworkService(context),
    admin: createAdminService(context),
    b2cUser: new B2cUserService(),
    request: createRequestService(context),
  }
}

// TODO: remove OBO and replace with the new application auth model
const adminOboAuth: HttpAuthFactory<BaseContext> = ({ user }) =>
  user?.token ? oboAuth(config.get('integrations.verifiedIdAdmin.auth'))({ assertionToken: user.token }) : Promise.resolve({})

function createNetworkService(context: BaseContext) {
  const httpClientOptions = {
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
  }

  return new NetworkService({
    ...httpClientOptions,
    baseUrl: config.get('integrations.verifiedIdNetwork.baseUrl'),
    authFactory: adminOboAuth,
  })
}

function createAdminService(context: BaseContext) {
  const httpClientOptions = {
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
  }

  return new AdminService({
    ...httpClientOptions,
    baseUrl: config.get('integrations.verifiedIdNetwork.baseUrl'),
    authFactory: adminOboAuth,
  })
}

function createRequestService(context: BaseContext) {
  const httpClientOptions = {
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
  }

  return new RequestService({
    ...httpClientOptions,
    baseUrl: config.get('integrations.verifiedIdRequest.baseUrl'),
    authFactory: <HttpAuthFactory<BaseContext>>clientCredentialsAuth(config.get('integrations.verifiedIdRequest.auth')),
    issuanceCallbackUrl: `https://${context.requestInfo.host}${config.get('issuanceCallback.route')}`,
    issuanceCallbackAuthConfig: config.get('issuanceCallback.auth'),
    presentationCallbackUrl: `https://${context.requestInfo.host}${config.get('presentationCallback.route')}`,
    presentationCallbackAuthConfig: config.get('presentationCallback.auth'),
  })
}
