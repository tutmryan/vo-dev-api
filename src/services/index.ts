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
import { logger } from '../logger'
import { Lazy } from '../util/lazy'
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

export const createLogoImagesService = () =>
  new BlobStorageContainerService({
    url: blobStorage.url,
    credentials: blobStorage.credentials,
    containerName: blobStorage.logoImagesContainer,
  })

export const createServices = (context: BaseContext): Services => {
  return {
    homeTenantGraph: createGraphService(),
    verifiedIdAdmin: createVerifiedIdAdminService(context.logger, context.requestInfo.correlationId),
    verifiedIdRequest: createVerifiedIdRequestService(context),
    logoImages: createLogoImagesService(),
    asyncIssuances: new AsyncIssuanceService(),
    communications: new CommunicationsService(context.logger),
  }
}

function createGraphService() {
  const { name: tenantName, tenantId, graphCredentials } = homeTenant
  return new GraphService({ tenantName, auth: { tenantId, ...graphCredentials } })
}

export async function testGraphService(): Promise<boolean> {
  const graphService = createGraphService()

  // This service is optional, so if it's not configured, we consider it healthy
  if (!graphService.isConfigured) return true

  try {
    await graphService.findUsers({ nameStartsWith: 'a' }, 1)
    return true
  } catch (error) {
    logger.error('Test for MS Graph service integration failed', { error })
  }

  return false
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

export const getPlatformIssuerDid = Lazy(async () => {
  const admin = createVerifiedIdAdminService(logger)
  const authority = await admin.authority()
  return authority.didModel.did
})

export async function testVidService(): Promise<boolean> {
  try {
    await getPlatformIssuerDid()
    return true
  } catch (error) {
    logger.error('Test for VID service integration failed', { error })
  }

  return false
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
