import type { AuthHeaders, HttpAuthFactory } from '@makerxstudio/node-common'
import { getOnBehalfOfToken } from '@makerxstudio/node-common'
import { newCacheSection } from '../cache'
import config from '../config'
import type { BaseContext } from '../context'
import { NetworkService } from './network'

export * from './network'

export interface Services {
  network: NetworkService
}

export const createServices = (context: BaseContext): Services => {
  const httpClientOptions = {
    requestContext: context,
    logger: context.logger,
    correlationId: context.requestInfo.correlationId,
  }

  return {
    network: new NetworkService({
      ...httpClientOptions,
      baseUrl: config.get('integrations.verifiedIdNetwork.baseUrl'),
      authFactory: adminOboAuthFactory,
    }),
  }
}

const adminOboAuthCache = newCacheSection('verifiedIdAdmin:oboAuth')

const adminOboAuthFactory: HttpAuthFactory<BaseContext> = async ({ user }) => {
  if (!user?.claims.oid) return <AuthHeaders>{}
  const {
    claims: { oid },
    token: assertionToken,
  } = user

  const cachedToken = await adminOboAuthCache.get(oid)
  if (cachedToken) return { authorization: `Bearer ${cachedToken}` }

  const oboConfig = config.get('integrations.verifiedIdAdmin.auth')
  const { access_token, expires_in } = await getOnBehalfOfToken({ ...oboConfig, assertionToken })
  await adminOboAuthCache.set(oid, access_token, { ttl: expires_in - 10 })
  return { authorization: `Bearer ${access_token}` }
}
