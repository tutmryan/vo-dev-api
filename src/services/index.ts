import type { AuthHeaders, HttpAuthFactory } from '@makerxstudio/node-common'
import { getOnBehalfOfToken } from '@makerxstudio/node-common'
import { newCacheSection } from '../cache'
import config from '../config'
import type { BaseContext } from '../context'
import { B2cUserService } from './b2c-user'
import { NetworkService } from './network'
import { AdminService } from './admin'

export * from './b2c-user'
export * from './network'

export interface Services {
  network: NetworkService
  b2cUser: B2cUserService
  admin: AdminService
}

export const createServices = (context: BaseContext): Services => {
  return {
    network: createNetworkService(context),
    admin: createAdminService(context),
    b2cUser: new B2cUserService(),
  }
}

const verifiedIdAdminOboAuthCache = newCacheSection('verifiedIdAdmin:oboAuth')

const verifiedIdAdminOboAuthFactory: HttpAuthFactory<BaseContext> = async ({ user }) => {
  if (!user?.claims.oid) return <AuthHeaders>{}
  const {
    claims: { oid },
    token: assertionToken,
  } = user

  const cachedToken = await verifiedIdAdminOboAuthCache.get(oid)
  if (cachedToken) return { authorization: `Bearer ${cachedToken}` }

  const oboConfig = config.get('integrations.verifiedIdAdmin.auth')
  const { access_token, expires_in } = await getOnBehalfOfToken({ ...oboConfig, assertionToken })
  await verifiedIdAdminOboAuthCache.set(oid, access_token, { ttl: expires_in - 10 })
  return { authorization: `Bearer ${access_token}` }
}

function createNetworkService(context: BaseContext) {
  const httpClientOptions = {
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
  }

  return new NetworkService({
    ...httpClientOptions,
    baseUrl: config.get('integrations.verifiedIdNetwork.baseUrl'),
    authFactory: verifiedIdAdminOboAuthFactory,
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
    authFactory: verifiedIdAdminOboAuthFactory,
  })
}
