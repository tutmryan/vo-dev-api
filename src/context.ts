import type { GraphQLContext as GraphQLContextBase, RequestInfo } from '@makerx/graphql-core'
import { createContextFactory } from '@makerx/graphql-core'
import { createSubscriptionContextFactory, extractTokenFromConnectionParams } from '@makerx/graphql-core/subscriptions'
import type { JwtPayload } from 'jsonwebtoken'
import type { DataSource } from 'typeorm'
import { logging, platformConsumerApps } from './config'
import type { CommandLike, DispatchContext } from './cqs'
import { dispatch } from './cqs'
import { dataSource } from './data'
import { getLimitedAccessData, LimitedAccessTokenAcquisitionRoles } from './features/limited-access-tokens'
import { getLimitedApprovalData } from './features/limited-approval-tokens'
import { getLimitedAsyncIssuanceDataForSession } from './features/limited-async-issuance-tokens'
import { getLimitedPhotoCaptureSession } from './features/limited-photo-capture-tokens'
import type { PhotoCaptureData } from './features/photo-capture'
import { getPhotoCaptureData } from './features/photo-capture'
import type { FindUpdateOrCreateUserInput } from './features/users/commands/find-update-or-create-user'
import { FindUpdateOrCreateUser } from './features/users/commands/find-update-or-create-user'
import { UserEntity } from './features/users/entities/user-entity'
import type { DataLoaders } from './loaders'
import { createDataLoaders } from './loaders'
import { logger } from './logger'
import { AppRoles, InternalClientRoles, InternalRoles, UserRoles } from './roles'
import type { Services } from './services'
import { createServices } from './services'
import { User } from './user'
import { enumStringValues } from './util/enum-util'
import { invariant } from './util/invariant'

export type BaseContext = GraphQLContextBase<typeof logger, RequestInfo, User | undefined>
export type GraphQLContext = BaseContext & {
  dataSource: DataSource
  services: Services
  dataLoaders: DataLoaders
}

const allClientRoles = [
  ...enumStringValues(UserRoles),
  ...enumStringValues(AppRoles),
  ...enumStringValues(LimitedAccessTokenAcquisitionRoles),
  ...enumStringValues(InternalClientRoles),
]

export const findUpdateOrCreateUser = async (claims?: JwtPayload, token?: string) => {
  if (!claims || !token) return undefined

  const tenantId = claims['tid'] as string
  invariant(tenantId, '`tid` claim is required')
  invariant(claims.oid, '`oid` claim is required')
  invariant(claims.sub, '`sub` claim is required')

  // Special case: when called with a limited access token:
  // - load the limited access data associated with the token
  // - load the user that acquired token
  const isLimitedAccessClient = Array.isArray(claims.roles) && claims.roles.includes(InternalRoles.limitedAccess)
  if (isLimitedAccessClient) {
    const limitedAccessData = await getLimitedAccessData(token)
    const userEntity = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id: limitedAccessData.userId } })
    return new User(claims, token, userEntity, limitedAccessData)
  }

  // Special case: when called with a limited approval token:
  // - load the limited approval data associated with the token
  // - load the user that created the approval request
  const isApprovalRequestClient = Array.isArray(claims.roles) && claims.roles.includes(InternalRoles.limitedApproval)
  if (isApprovalRequestClient) {
    const limitedApprovalData = await getLimitedApprovalData(token)
    const userEntity = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id: limitedApprovalData.userId } })
    return new User(claims, token, userEntity, undefined, limitedApprovalData)
  }

  // Special case: when called with a limited photo capture token:
  // - load the photo capture data associated with the token
  // - load the user that created the photo capture request
  const isLimitedPhotoCaptureClient = Array.isArray(claims.roles) && claims.roles.includes(InternalRoles.limitedPhotoCapture)
  if (isLimitedPhotoCaptureClient) {
    const photoCaptureRequestId = await getLimitedPhotoCaptureSession(token)
    invariant(photoCaptureRequestId, 'Invalid token')
    const photoCaptureData = await getPhotoCaptureData(photoCaptureRequestId)
    invariant(photoCaptureData, 'Invalid token')
    const userEntity = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id: photoCaptureData.userId } })
    return new User(claims, token, userEntity, undefined, undefined, photoCaptureData)
  }

  // Special case: when called with a limited async issuance token:
  // - load the limited async issuance data associated with the token
  // - optionally load the photo capture data associated with the token
  // - load the user that created the async issuance request
  const isLimitedAsyncIssuanceClient = Array.isArray(claims.roles) && claims.roles.includes(InternalRoles.limitedAsyncIssuance)
  if (isLimitedAsyncIssuanceClient) {
    // load async issuance data
    const limitedAsyncIssuanceData = await getLimitedAsyncIssuanceDataForSession(token)
    invariant(limitedAsyncIssuanceData, 'Invalid token')

    // optionally load photo capture data during photo capture session
    let photoCaptureData: PhotoCaptureData | undefined
    if (limitedAsyncIssuanceData.photoCapture) {
      const photoCaptureRequestId = await getLimitedPhotoCaptureSession(token)
      if (photoCaptureRequestId) {
        photoCaptureData = await getPhotoCaptureData(photoCaptureRequestId)
        invariant(photoCaptureData, 'Invalid token')
      }
    }

    const userEntity = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id: limitedAsyncIssuanceData.userId } })
    return new User(claims, token, userEntity, undefined, undefined, photoCaptureData, limitedAsyncIssuanceData)
  }

  // When there are no recognised roles, do not create a user
  if (allClientRoles.every((r) => !claims.roles?.includes(r))) return undefined

  // Otherwise, find/create the user
  const userEntity = await findUpdateOrCreateUserEntity(claims)
  return new User(claims, token, userEntity)
}

export const findUpdateOrCreateUserEntity = async (claims: JwtPayload): Promise<UserEntity> => {
  /**
   * We determine whether the incoming identity is an app two ways:
   *  - If we have the `idtyp` claim, we check if its value is `app`
   *  - Otherwise, we check if the `oid` and the `sub` claims have the same values
   */

  const idType = claims['idtyp']
  const isApp = typeof idType === 'string' ? (idType as string) === 'app' : claims.oid === claims.sub

  const tenantId = claims['tid'] as string
  const input: FindUpdateOrCreateUserInput = {
    tenantId,
    oid: claims.oid,
    name: (isApp ? platformConsumerApps[claims.oid] : undefined) ?? claims.name ?? claims.sub,
    email: claims.email ?? null,
    isApp,
  }

  return dispatchWithoutContext(undefined, FindUpdateOrCreateUser, input)
}

// When we don't have a graphql context, dispatch with just enough context to run the command
export const dispatchWithoutContext = async <T extends CommandLike>(
  partialContext: Partial<DispatchContext> | undefined,
  command: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> => {
  const context: DispatchContext = {
    dataSource,
    user: undefined,
    logger,
    requestInfo: {} as any as RequestInfo,
    services: {} as any as Services,
    dataLoaders: {} as any as DataLoaders,
    ...partialContext,
  }
  return dispatch(context, command, ...args)
}

const augmentContext = (context: BaseContext) => {
  const services = createServices(context)
  const dataLoaders = createDataLoaders()
  return { services, dataSource, dataLoaders }
}

export const createContext = createContextFactory<GraphQLContext>({
  claimsToLog: logging.userClaimsToLog,
  requestInfoToLog: logging.requestInfoToLog,
  requestLogger: (requestMetadata) => logger.child(requestMetadata),
  createUser: ({ claims, req }) => findUpdateOrCreateUser(claims, req.headers.authorization?.substring(7)),
  augmentContext,
})

export const createSubscriptionContext = createSubscriptionContextFactory<GraphQLContext>({
  claimsToLog: logging.userClaimsToLog,
  requestInfoToLog: logging.requestInfoToLog,
  requestLogger: (requestMetadata) => logger.child(requestMetadata),
  createUser: ({ claims, connectionParams }) => findUpdateOrCreateUser(claims, extractTokenFromConnectionParams(connectionParams)),
  augmentContext,
})
