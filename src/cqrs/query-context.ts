import type { User } from '@makerxstudio/graphql-core'
import type { Logger } from '@makerxstudio/node-winston'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'

export type QueryContext = {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly user?: User
  readonly logger: Logger
  readonly contextType: 'query'
}
