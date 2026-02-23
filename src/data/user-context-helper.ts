import type { EntityManager, QueryRunner } from 'typeorm'
import { throwError } from '../util/throw-error'
import type { VerifiedOrchestrationEntityManager } from './entity-manager'

const contextMap = new WeakMap<EntityManager | VerifiedOrchestrationEntityManager, string>()
const queryRunnerContextMap = new WeakMap<QueryRunner, string>()

export const addUserToManager = (entityManager: EntityManager | VerifiedOrchestrationEntityManager, userId: string) => {
  contextMap.set(entityManager, userId)
  // Also store on the queryRunner so event subscribers (which may receive a different manager instance) can find the user
  const em = entityManager as EntityManager
  if (em.queryRunner) {
    queryRunnerContextMap.set(em.queryRunner, userId)
  }
}

export const getUserFromManager = (entityManager: EntityManager | VerifiedOrchestrationEntityManager): string => {
  const found = contextMap.get(entityManager)
  if (found) return found
  // Fallback: look up by queryRunner (needed for SQLite where event.manager differs from transaction entityManager)
  const em = entityManager as EntityManager
  if (em.queryRunner) {
    const fromQr = queryRunnerContextMap.get(em.queryRunner)
    if (fromQr) return fromQr
  }
  return throwError(new Error('No user has been attached to this EntityManager'))
}
