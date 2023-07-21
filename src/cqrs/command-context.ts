import type { Logger } from '@makerx/node-winston'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'
import type { DataLoaders } from '../loaders'
import type { Services } from '../services'
import type { User } from '../user'

export type CommandContext = {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly user?: User
  readonly logger: Logger
  readonly services: Services
  readonly dataLoaders: DataLoaders
  readonly contextType: 'command'
}
