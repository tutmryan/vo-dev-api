import type { CommandContext, TransactionalCommandContext, QueryContext } from '.'
import type { GraphQLContext } from '../context'
import { entityManager, ISOLATION_LEVEL as TXN_ISOLATION_LEVEL } from '../data'
import { addUserToManager } from '../features/auditing/user-context-helper'
import { performFeatureCheck } from './feature-map'

export type CommandLike = (this: CommandContext, ...args: any) => any
export type TransactionalCommandLike = (this: TransactionalCommandContext, ...args: any) => any
export type QueryLike = (this: QueryContext, ...args: any) => any

export type DispatchContext = Pick<GraphQLContext, 'dataSource' | 'user' | 'services' | 'dataLoaders' | 'logger' | 'requestInfo'>

export const dispatch = async <T extends CommandLike>(
  { dataSource, user, logger, services, dataLoaders, requestInfo }: DispatchContext,
  command: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> => {
  return await dataSource.manager.transaction(TXN_ISOLATION_LEVEL, async (entityManager) => {
    if (user) {
      addUserToManager(entityManager, user.userEntity.id)
    }

    const ctx: CommandContext = {
      user,
      entityManager,
      logger,
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
  { dataSource, user, logger, services, dataLoaders, requestInfo }: DispatchContext,
  command: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> => {
  const context: TransactionalCommandContext = {
    user,
    logger,
    services,
    dataLoaders,
    requestInfo,
    contextType: 'command',
    inTransaction: async (fn) => {
      return await dataSource.manager.transaction(TXN_ISOLATION_LEVEL, async (entityManager) => {
        if (user) {
          addUserToManager(entityManager, user.userEntity.id)
        }
        return await fn(entityManager)
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
  return (await query.apply(
    {
      user,
      entityManager,
      logger,
      services,
      dataLoaders,
      contextType: 'query',
    },
    args,
  )) as Awaited<ReturnType<T>>
}
