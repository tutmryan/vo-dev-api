import type { EntityManager } from 'typeorm'
import type { IsolationLevel } from 'typeorm/driver/types/IsolationLevel'
import { dataSource } from './data-source'
import { addUserToManager } from './user-context-helper'

export * from './data-source'
export const ISOLATION_LEVEL: IsolationLevel = 'REPEATABLE READ'

export function runInTransaction<T>(userId: string, runInTransaction: (entityManager: EntityManager) => Promise<T>): Promise<T> {
  return dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
    addUserToManager(entityManager, userId)
    return runInTransaction(entityManager)
  })
}
