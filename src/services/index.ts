import type { HttpAuthFactory } from '@makerx/node-common'
import { createClientCredentialsAuthFactory as clientCredentialsAuth } from '@makerx/node-common'
import config, { authorityId, callbackAuth, vidServiceAuth } from '../config'
import type { BaseContext } from '../context'
import { BlobStorageContainerService } from './blob-storage-container-service'
import { GraphService } from './graph-service'
import { VerifiedIdAdminService, VerifiedIdRequestService } from './verified-id'

export * from './graph-service'

export interface Services {
  homeTenantGraph: GraphService
  verifiedIdAdmin: VerifiedIdAdminService
  verifiedIdRequest: VerifiedIdRequestService
  logoImages: BlobStorageContainerService
}

export const createServices = (context: BaseContext): Services => {
  return {
    homeTenantGraph: createGraphService(),
    verifiedIdAdmin: createVerifiedIdAdminService(context.logger, context.requestInfo.correlationId),
    verifiedIdRequest: createVerifiedIdRequestService(context),
    logoImages: new BlobStorageContainerService({ containerName: config.get('blobStorage.logoImagesContainer') }),
  }
}

function createGraphService() {
  const { name: tenantName, tenantId, graphCredentials } = config.get('homeTenant')
  return new GraphService({ tenantName, auth: { tenantId, ...graphCredentials } })
}

export function createVerifiedIdAdminService(logger: BaseContext['logger'], correlationId?: string) {
  const { baseUrl, scope } = config.get('verifiedIdAdmin')

  return new VerifiedIdAdminService(
    {
      baseUrl,
      logger,
      correlationId,
      authFactory: <HttpAuthFactory>clientCredentialsAuth({ scope, ...vidServiceAuth }),
    },
    authorityId,
  )
}

function createVerifiedIdRequestService(context: BaseContext) {
  const { baseUrl, scope } = config.get('verifiedIdRequest')

  const httpClientOptions = {
    baseUrl,
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
    authFactory: <HttpAuthFactory<BaseContext>>clientCredentialsAuth({ scope, ...vidServiceAuth }),
  }

  return new VerifiedIdRequestService({
    ...httpClientOptions,
    issuanceCallbackUrl: `https://${context.requestInfo.host}${config.get('issuanceCallbackRoute')}`,
    issuanceCallbackAuthConfig: callbackAuth,
    presentationCallbackUrl: `https://${context.requestInfo.host}${config.get('presentationCallbackRoute')}`,
    presentationCallbackAuthConfig: callbackAuth,
  })
}
