import type { GraphQLContext as GraphQLContextBase, RequestInfo } from '@makerx/graphql-core'
import { createContextFactory, createSubscriptionContextFactory, extractTokenFromConnectionParams } from '@makerx/graphql-core'
import type { JwtPayload } from 'jsonwebtoken'
import type { DataSource } from 'typeorm'
import config from './config'
import type { DispatchContext } from './cqs'
import { dispatch } from './cqs'
import { dataSource } from './data'
import { getLimitedAccessData, limitedAccessRole } from './features/limited-access-tokens'
import type { FindUpdateOrCreateUserInput } from './features/users/commands/find-update-or-create-user'
import { FindUpdateOrCreateUser } from './features/users/commands/find-update-or-create-user'
import { UserEntity } from './features/users/entities/user-entity'
import type { DataLoaders } from './loaders'
import { createDataLoaders } from './loaders'
import { logger } from './logger'
import type { Services } from './services'
import { createServices } from './services'
import { User } from './user'
import { invariant } from './util/invariant'

export type BaseContext = GraphQLContextBase<typeof logger, RequestInfo, User | undefined>
export type GraphQLContext = BaseContext & {
  dataSource: DataSource
  services: Services
  dataLoaders: DataLoaders
}

export const findUpdateOrCreateUser = async (claims?: JwtPayload, token?: string) => {
  if (!claims || !token) return undefined

  const tenantId = claims['tid'] as string
  invariant(tenantId, '`tid` claim is required')
  invariant(claims.oid, '`oid` claim is required')
  invariant(claims.sub, '`sub` claim is required')

  const isLimitedAccessClient = Array.isArray(claims.roles) && claims.roles.includes(limitedAccessRole)

  // Special case: when called with a limited access token:
  // - load the limited access data associated with the token
  // - load the user that acquired token
  if (isLimitedAccessClient) {
    const limitedAccessData = await getLimitedAccessData(token)
    const userEntity = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id: limitedAccessData.userId } })
    return new User(claims, token, userEntity, limitedAccessData)
  }

  /**
   * We determine whether the incoming identity is an app two ways:
   *  - If we have the `idtyp` claim, we check if its value is `app`
   *  - Otherwise, we check if the `oid` and the `sub` claims have the same values
   */
  const idType = claims['idtyp']
  const isApp = typeof idType === 'string' ? (idType as string) === 'app' : claims.oid === claims.sub

  const input: FindUpdateOrCreateUserInput = {
    tenantId,
    oid: claims.oid,
    name: (isApp ? config.get('platformConsumerApps')[claims.oid] : undefined) ?? claims.name ?? claims.sub,
    email: claims.email ?? null,
    isApp,
  }

  // we don't have a graphql context yet, so create just enough to dispatch the FindUpdateOrCreateUser command
  const context: DispatchContext = {
    dataSource,
    user: undefined,
    logger,
    requestInfo: {} as any as RequestInfo,
    services: {} as any as Services,
    dataLoaders: {} as any as DataLoaders,
  }
  const userEntity = await dispatch(context, FindUpdateOrCreateUser, input)

  return new User(claims, token, userEntity)
}

const augmentContext = (context: BaseContext) => {
  const services = createServices(context)
  const dataLoaders = createDataLoaders()
  return { services, dataSource, dataLoaders }
}

export const createContext = createContextFactory<GraphQLContext>({
  claimsToLog: config.get('logging.userClaimsToLog'),
  requestInfoToLog: config.get('logging.requestInfoToLog'),
  requestLogger: (requestMetadata) => logger.child(requestMetadata),
  createUser: ({ claims, req }) => findUpdateOrCreateUser(claims, req.headers.authorization?.substring(7)),
  augmentContext,
})

export const createSubscriptionContext = createSubscriptionContextFactory<GraphQLContext>({
  claimsToLog: config.get('logging.userClaimsToLog'),
  requestInfoToLog: config.get('logging.requestInfoToLog'),
  requestLogger: (requestMetadata) => logger.child(requestMetadata),
  createUser: ({ claims, connectionParams }) => findUpdateOrCreateUser(claims, extractTokenFromConnectionParams(connectionParams)),
  augmentContext,
})
