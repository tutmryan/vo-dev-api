import type { HttpAuthFactory } from '@makerxstudio/node-common'
import { createClientCredentialsAuthFactory as clientCredentialsAuth } from '@makerxstudio/node-common'
import config from '../config'
import type { BaseContext } from '../context'
import { AdminService } from './admin'
import { B2cUserService } from './b2c-user'
import { RequestService } from './request'

export * from './b2c-user'

export interface Services {
  b2cUser: B2cUserService
  admin: AdminService
  request: RequestService
}

export const createServices = (context: BaseContext): Services => {
  return {
    admin: createAdminService(context),
    b2cUser: new B2cUserService(),
    request: createRequestService(context),
  }
}

function createAdminService(context: BaseContext) {
  const httpClientOptions = {
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
  }

  return new AdminService({
    ...httpClientOptions,
    baseUrl: config.get('integrations.verifiedIdAdmin.baseUrl'),
    authFactory: <HttpAuthFactory<BaseContext>>clientCredentialsAuth(config.get('integrations.verifiedIdAdmin.auth')),
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
