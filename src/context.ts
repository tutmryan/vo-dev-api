import type { CreateUser, GraphQLContext as GraphQLContextBase, RequestInfo } from '@makerxstudio/graphql-core'
import { createContextFactory } from '@makerxstudio/graphql-core'
import type { DataSource } from 'typeorm'
import config from './config'
import { dispatch } from './cqrs/dispatcher'
import { dataSource } from './data'
import type { FindUpdateOrCreateUserInput } from './features/users/commands/find-update-or-create-user'
import { FindUpdateOrCreateUser } from './features/users/commands/find-update-or-create-user'
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

export const findUpdateOrCreateUser: CreateUser<User | undefined> = async ({ claims, req }) => {
  if (!claims) return undefined

  const tenantId = claims['tid'] as string
  invariant(tenantId, '`tid` claim is required')
  invariant(claims.oid, '`oid` claim is required')
  invariant(claims.sub, '`sub` claim is required')

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
    name: (isApp ? config.get('platformConsumerApps')[claims.oid]?.name : undefined) ?? claims.name ?? claims.sub,
    email: claims.email ?? null,
    isApp,
  }

  // we don't have a real graphql context yet, so create just enough to dispatch FindUpdateOrCreateUser command
  const context: Pick<GraphQLContext, 'dataSource' | 'user' | 'logger' | 'services' | 'dataLoaders'> = {
    dataSource,
    user: undefined,
    logger,
    services: {} as any as Services,
    dataLoaders: {} as any as DataLoaders,
  }

  const userEntity = await dispatch(context, FindUpdateOrCreateUser, input)

  return new User(claims, req.headers.authorization?.substring(7) ?? '', userEntity)
}

export const createContext = createContextFactory<GraphQLContext>({
  claimsToLog: config.get('logging.userClaimsToLog'),
  requestInfoToLog: config.get('logging.requestInfoToLog'),
  requestLogger: (requestMetadata) => logger.child(requestMetadata),
  createUser: findUpdateOrCreateUser,
  augmentContext: (context) => {
    const services = createServices(context)
    const dataLoaders = createDataLoaders()
    return { services, dataSource, dataLoaders }
  },
})
