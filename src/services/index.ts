import type { HttpAuthFactory } from '@makerx/node-common'
import { createClientCredentialsAuthFactory as clientCredentialsAuth } from '@makerx/node-common'
import {
  authorityId,
  blobStorage,
  callbackAuth,
  homeTenant,
  issuanceCallbackRoute,
  presentationCallbackRoute,
  verifiedIdAdmin,
  verifiedIdRequest,
  vidServiceAuth,
} from '../config'
import type { BaseContext } from '../context'
import { AsyncIssuanceService } from './async-issuance-service'
import { BlobStorageContainerService } from './blob-storage-container-service'
import { CommunicationsService } from './communications-service'
import { GraphService } from './graph-service'
import { VerifiedIdAdminService, VerifiedIdRequestService } from './verified-id'

export * from './graph-service'

export interface Services {
  homeTenantGraph: GraphService
  verifiedIdAdmin: VerifiedIdAdminService
  verifiedIdRequest: VerifiedIdRequestService
  logoImages: BlobStorageContainerService
  asyncIssuances: AsyncIssuanceService
  communications: CommunicationsService
}

export const createServices = (context: BaseContext): Services => {
  return {
    homeTenantGraph: createGraphService(),
    verifiedIdAdmin: createVerifiedIdAdminService(context.logger, context.requestInfo.correlationId),
    verifiedIdRequest: createVerifiedIdRequestService(context),
    logoImages: new BlobStorageContainerService({
      url: blobStorage.url,
      credentials: blobStorage.credentials,
      containerName: blobStorage.logoImagesContainer,
    }),
    asyncIssuances: new AsyncIssuanceService(),
    communications: new CommunicationsService(context.logger),
  }
}

function createGraphService() {
  const { name: tenantName, tenantId, graphCredentials } = homeTenant
  return new GraphService({ tenantName, auth: { tenantId, ...graphCredentials } })
}

export function createVerifiedIdAdminService(logger: BaseContext['logger'], correlationId?: string) {
  const { baseUrl, scope } = verifiedIdAdmin

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
  const { baseUrl, scope } = verifiedIdRequest

  const httpClientOptions = {
    baseUrl,
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
    authFactory: <HttpAuthFactory<BaseContext>>clientCredentialsAuth({ scope, ...vidServiceAuth }),
  }

  return new VerifiedIdRequestService({
    ...httpClientOptions,
    issuanceCallbackUrl: `https://${context.requestInfo.host}${issuanceCallbackRoute}`,
    issuanceCallbackAuthConfig: callbackAuth,
    presentationCallbackUrl: `https://${context.requestInfo.host}${presentationCallbackRoute}`,
    presentationCallbackAuthConfig: callbackAuth,
  })
}
