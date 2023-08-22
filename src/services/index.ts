import type { HttpAuthFactory } from '@makerx/node-common'
import { createClientCredentialsAuthFactory as clientCredentialsAuth } from '@makerx/node-common'
import config from '../config'
import type { BaseContext } from '../context'
import type { logger } from '../logger'
import { AdminService } from './admin'
import { GraphService } from './graph-service'
import { RequestService } from './request'

export * from './graph-service'

export interface Services {
  homeTenantGraph: GraphService
  b2cGraph: GraphService
  admin: AdminService
  request: RequestService
}

export const createServices = (context: BaseContext): Services => {
  return {
    b2cGraph: new GraphService(config.get('integrations.b2cGraph')),
    homeTenantGraph: new GraphService(config.get('homeTenantGraph')),
    admin: createAdminService(context.logger, context.requestInfo.correlationId),
    request: createRequestService(context),
  }
}

export function createAdminService(loggerParam: typeof logger, correlationId?: string) {
  const httpClientOptions = {
    logger: loggerParam,
    correlationId,
  }

  return new AdminService({
    ...httpClientOptions,
    baseUrl: config.get('integrations.verifiedIdAdmin.baseUrl'),
    authFactory: <HttpAuthFactory>clientCredentialsAuth(config.get('integrations.verifiedIdAdmin.auth')),
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
