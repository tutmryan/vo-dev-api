import type { EntityManager } from 'typeorm'
import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import { throwError } from '../../util/throw-error'

const contextMap = new WeakMap<EntityManager | VerifiedOrchestrationEntityManager, string>()

export const addUserToManager = (entityManager: EntityManager | VerifiedOrchestrationEntityManager, userId: string) => {
  contextMap.set(entityManager, userId)
}

export const getUserFromManager = (entityManager: EntityManager | VerifiedOrchestrationEntityManager): string => {
  return contextMap.get(entityManager) ?? throwError(new Error('No user has been attached to this EntityManager'))
}
