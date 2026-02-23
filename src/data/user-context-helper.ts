import type { EntityManager } from 'typeorm'
import { throwError } from '../util/throw-error'
import type { VerifiedOrchestrationEntityManager } from './entity-manager'

const contextMap = new WeakMap<EntityManager | VerifiedOrchestrationEntityManager, string>()

export const addUserToManager = (entityManager: EntityManager | VerifiedOrchestrationEntityManager, userId: string) => {
  contextMap.set(entityManager, userId)
}

export const getUserFromManager = (entityManager: EntityManager | VerifiedOrchestrationEntityManager): string => {
  return contextMap.get(entityManager) ?? throwError(new Error('No user has been attached to this EntityManager'))
}
