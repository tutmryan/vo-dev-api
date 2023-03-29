import type { CreateUser, GraphQLContext as GraphQLContextBase, RequestInfo } from '@makerxstudio/graphql-core'
import { createContextFactory } from '@makerxstudio/graphql-core'
import type { DataSource } from 'typeorm'
import config from './config'
import { logger } from './logger'
import type { Services } from './services'
import { B2cUserService, createServices, NetworkService } from './services'
import { dataSource } from './data'
import { User } from './user'
import { invariant } from './util/invariant'
import type { FindUpdateOrCreateUserInput } from './features/users/commands/find-update-or-create-user'
import { FindUpdateOrCreateUser } from './features/users/commands/find-update-or-create-user'
import { dispatch } from './cqrs/dispatcher'
import { AdminService } from './services/admin'

export type BaseContext = GraphQLContextBase<typeof logger, RequestInfo, User | undefined>
export type GraphQLContext = BaseContext & {
  dataSource: DataSource
  services: Services
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
    name: claims.name ?? claims.sub,
    email: claims.email ?? null,
    isApp,
  }

  const context: Pick<GraphQLContext, 'dataSource' | 'user' | 'services'> = {
    dataSource,
    user: undefined,
    services: {
      b2cUser: new B2cUserService(),
      admin: new AdminService({}),
      network: new NetworkService({}),
    },
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
    return { services, dataSource }
  },
})
