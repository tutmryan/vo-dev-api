import type { User } from '@makerx/graphql-core'
import type { Logger } from '@makerx/node-winston'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'
import type { DataLoaders } from '../loaders'

export type QueryContext = {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly user?: User
  readonly logger: Logger
  readonly dataLoaders: DataLoaders
  readonly contextType: 'query'
}
