import type { GraphQLContext } from '../context'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'

export type CommandContext = Readonly<Pick<GraphQLContext, 'user' | 'logger' | 'services' | 'dataLoaders' | 'requestInfo'>> & {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly contextType: 'command'
}

export type MultiTransactionalCommandContext = {
  runInTransaction: <T>(fn: (context: CommandContext) => Promise<T>) => Promise<T>
}

export type QueryContext = Readonly<Pick<GraphQLContext, 'user' | 'logger' | 'services' | 'dataLoaders'>> & {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly contextType: 'query'
}
