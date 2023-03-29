import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'
import type { Services } from '../services'
import type { User } from '../user'

export type CommandContext = {
  readonly entityManager: VerifiedOrchestrationEntityManager
  readonly user?: User
  readonly services: Services
  readonly contextType: 'command'
}
