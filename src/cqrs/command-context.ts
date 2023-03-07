import type { User } from '@makerxstudio/graphql-core'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'

export type CommandContext = {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly user?: User
  readonly contextType: 'command'
}
