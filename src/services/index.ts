import type { HttpAuthFactory } from '@makerx/node-common'
import { createClientCredentialsAuthFactory as clientCredentialsAuth } from '@makerx/node-common'
import config from '../config'
import type { BaseContext } from '../context'
import type { logger } from '../logger'
import { BlobStorageContainerService } from './blob-storage-container-service'
import { GraphService } from './graph-service'
import { VerifiedIdAdminService, VerifiedIdRequestService } from './verified-id'

export * from './graph-service'

export interface Services {
  homeTenantGraph: GraphService
  b2cGraph: GraphService
  verifiedIdAdmin: VerifiedIdAdminService
  verifiedIdRequest: VerifiedIdRequestService
  logoImages: BlobStorageContainerService
}

export const createServices = (context: BaseContext): Services => {
  return {
    b2cGraph: new GraphService(config.get('integrations.b2cGraph')),
    homeTenantGraph: new GraphService(config.get('homeTenantGraph')),
    verifiedIdAdmin: createVerifiedIdAdminService(context.logger, context.requestInfo.correlationId),
    verifiedIdRequest: createVerifiedIdRequestService(context),
    logoImages: new BlobStorageContainerService({ containerName: config.get('blobStorage.logoImagesContainer') }),
  }
}

export function createVerifiedIdAdminService(loggerParam: typeof logger, correlationId?: string) {
  const { authorityId, baseUrl, auth } = config.get('integrations.verifiedIdService')

  return new VerifiedIdAdminService(
    {
      logger: loggerParam,
      correlationId,
      baseUrl,
      authFactory: <HttpAuthFactory>clientCredentialsAuth(auth),
    },
    authorityId,
  )
}

function createVerifiedIdRequestService(context: BaseContext) {
  const httpClientOptions = {
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
  }

  const { baseUrl, auth } = config.get('integrations.verifiedIdService')

  return new VerifiedIdRequestService({
    ...httpClientOptions,
    baseUrl,
    authFactory: <HttpAuthFactory<BaseContext>>clientCredentialsAuth(auth),
    issuanceCallbackUrl: `https://${context.requestInfo.host}${config.get('issuanceCallback.route')}`,
    issuanceCallbackAuthConfig: config.get('issuanceCallback.auth'),
    presentationCallbackUrl: `https://${context.requestInfo.host}${config.get('presentationCallback.route')}`,
    presentationCallbackAuthConfig: config.get('presentationCallback.auth'),
  })
}
