import type { GraphQLContext } from '../context'
import { entityManager, ISOLATION_LEVEL as TXN_ISOLATION_LEVEL } from '../data'
import type { CommandContext } from './command-context'
import type { QueryContext } from './query-context'

export type CommandLike = (this: CommandContext, ...args: any) => any
export type QueryLike = (this: QueryContext, ...args: any) => any

export const dispatch = async <T extends CommandLike>(
  context: Pick<GraphQLContext, 'dataSource' | 'user'>,
  command: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> => {
  return await context.dataSource.manager.transaction(TXN_ISOLATION_LEVEL, async (entityManager) => {
    const { user } = context
    return await command.apply(
      {
        user,
        entityManager,
        contextType: 'command',
      },
      args,
    )
  })
}

export const query = async <T extends QueryLike>(
  context: Omit<GraphQLContext, 'loaders'>,
  query: T,
  ...args: Parameters<T>
): Promise<Awaited<ReturnType<T>>> => {
  const { user } = context
  return (await query.apply(
    {
      user,
      entityManager,
      contextType: 'query',
    },
    args,
  )) as Awaited<ReturnType<T>>
}
