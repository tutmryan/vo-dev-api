import type { GraphQLContext } from '../context'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'
import type { LoggerWithMetaControl } from '../logger'

export type CommandContext = Readonly<Pick<GraphQLContext, 'user' | 'services' | 'dataLoaders' | 'requestInfo'>> & {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly contextType: 'command'
  logger: LoggerWithMetaControl
}

export type TransactionalCommandContext = Omit<CommandContext, 'entityManager'> & {
  inTransaction: <T>(fn: (entityManager: CommandContext['entityManager']) => Promise<T>, userManagerUserId?: string) => Promise<T>
}

export type QueryContext = Readonly<Pick<GraphQLContext, 'user' | 'services' | 'dataLoaders'>> & {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly contextType: 'query'
  logger: LoggerWithMetaControl
}
