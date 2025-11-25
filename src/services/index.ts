import type { HttpAuthFactory } from '@makerx/node-common'
import { createClientCredentialsAuthFactory as clientCredentialsAuth } from '@makerx/node-common'
import {
  authorityId,
  blobStorage,
  callbackAuth,
  issuanceCallbackRoute,
  presentationCallbackRoute,
  verifiedIdAdmin,
  verifiedIdRequest,
  vidServiceAuth,
} from '../config'
import type { BaseContext } from '../context'
import type { MsGraphFailure } from '../generated/graphql'
import { logger, type Logger } from '../logger'
import { Lazy } from '../util/lazy'
import { AsyncIssuanceService } from './async-issuance-service'
import { BlobStorageContainerService } from './blob-storage-container-service'
import { CommunicationsService } from './communications-service'
import { graphServiceManager, type IGraphServiceManager } from './graph-service'
import { VerifiedIdAdminService, VerifiedIdRequestService } from './verified-id'

export * from './graph-service'

export interface Services {
  graphServiceManager: IGraphServiceManager
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
    graphServiceManager: graphServiceManager,
    verifiedIdAdmin: createVerifiedIdAdminService(context.logger, context.requestInfo.correlationId),
    verifiedIdRequest: createVerifiedIdRequestService(context),
    logoImages: createLogoImagesService(),
    asyncIssuances: new AsyncIssuanceService(),
    communications: new CommunicationsService(context.logger),
  }
}

export async function testAllGraphServices(): Promise<MsGraphFailure[] | undefined> {
  // Runs in a background job, graphServiceManager may not be initialized yet
  await graphServiceManager.init()
  const failures: MsGraphFailure[] = []

  for (const graphService of graphServiceManager.all) {
    if (!graphService.isConfigured) continue
    try {
      await graphService.findUsers({ nameStartsWith: 'a' }, 1)
    } catch (error) {
      logger.error('Test for MS Graph service integration failed', { error })
      failures.push({
        identityStoreId: graphService.config.identityStoreId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return failures.length > 0 ? failures : undefined
}

export function createVerifiedIdAdminService(logger: Logger, correlationId?: string) {
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

export async function testVidService(): Promise<string | undefined> {
  try {
    await getPlatformIssuerDid()
    return undefined
  } catch (error) {
    logger.error('Test for VID service integration failed', { error })
    return error instanceof Error ? error.message : String(error)
  }
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
