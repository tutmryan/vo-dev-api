import type { CommandContext, QueryContext, TransactionalCommandContext } from '.'
import { type GraphQLContext } from '../context'
import { entityManager, transactionOrReuse } from '../data'
import { wrapEntityManagerWithSafeLimits } from '../data/entity-manager'
import { addUserToManager } from '../data/user-context-helper'
import { resolveFeature } from '../util/featureResolver'
import { userIsUserEntity } from '../util/user-invariant'
import { performFeatureCheck } from './feature-map'

export type CommandLike = (this: CommandContext, ...args: any) => any
export type TransactionalCommandLike = (this: TransactionalCommandContext, ...args: any) => any
export type QueryLike = (this: QueryContext, ...args: any) => any

export type DispatchContext = Pick<GraphQLContext, 'dataSource' | 'user' | 'services' | 'dataLoaders' | 'logger' | 'requestInfo'>

export const dispatch = async <T extends CommandLike>(
  { user, logger, services, dataLoaders, requestInfo }: DispatchContext,
  command: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> => {
  return await transactionOrReuse(async (entityManager) => {
    if (userIsUserEntity(user)) {
      addUserToManager(entityManager, user.entity.id)
    }

    const ctx: CommandContext = {
      user,
      entityManager: wrapEntityManagerWithSafeLimits(entityManager),
      logger: logger.child({ feature: resolveFeature(command), command: command.name }),
      services,
      dataLoaders,
      requestInfo,
      contextType: 'command',
    }

    await performFeatureCheck(ctx, command, args)

    return await command.apply(ctx, args)
  })
}

export const dispatchTransactional = async <T extends TransactionalCommandLike>(
  { user, logger, services, dataLoaders, requestInfo }: DispatchContext,
  command: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> => {
  const context: TransactionalCommandContext = {
    user,
    logger: logger.child({ feature: resolveFeature(command), command: command.name }),
    services,
    dataLoaders,
    requestInfo,
    contextType: 'command',
    inTransaction: async (fn, userManagerUserId) => {
      return await transactionOrReuse(async (entityManager) => {
        if (userManagerUserId) addUserToManager(entityManager, userManagerUserId)
        else if (userIsUserEntity(user)) addUserToManager(entityManager, user.entity.id)
        return await fn(wrapEntityManagerWithSafeLimits(entityManager))
      })
    },
  }

  return await command.apply(context, args)
}

export const query = async <T extends QueryLike>(
  context: Omit<QueryContext, 'entityManager' | 'contextType'>,
  query: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> => {
  const { user, logger, services, dataLoaders } = context
  const queryContext: QueryContext = {
    user,
    entityManager: wrapEntityManagerWithSafeLimits(entityManager),
    logger: logger.child({ feature: resolveFeature(query), query: query.name }),
    services,
    dataLoaders,
    contextType: 'query',
  }

  return (await query.apply(queryContext, args)) as Awaited<ReturnType<T>>
}
