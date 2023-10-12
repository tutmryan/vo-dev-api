import type { GraphQLContext } from '../context'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'

export type QueryContext = Readonly<Pick<GraphQLContext, 'user' | 'logger' | 'services' | 'dataLoaders'>> & {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly contextType: 'query'
}
