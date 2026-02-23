import { AsyncLocalStorage } from 'async_hooks'
import type { EntityManager } from 'typeorm'
import type { IsolationLevel } from 'typeorm/driver/types/IsolationLevel'
import { dataSource, isSqlite } from './data-source'
import { addUserToManager } from './user-context-helper'

export * from './data-source'
export const ISOLATION_LEVEL: IsolationLevel = isSqlite ? 'SERIALIZABLE' : 'REPEATABLE READ'

const sqliteTransactionStorage = new AsyncLocalStorage<EntityManager>()

let sqliteMutex: Promise<void> = Promise.resolve()

export function transactionOrReuse<T>(fn: (entityManager: EntityManager) => Promise<T>): Promise<T> {
  if (isSqlite) {
    const existing = sqliteTransactionStorage.getStore()
    if (existing) return fn(existing)

    // Serialize transactions through a mutex to prevent concurrent BEGIN TRANSACTION on the single SQLite connection
    return new Promise<T>((resolve, reject) => {
      sqliteMutex = sqliteMutex.then(async () => {
        try {
          const result = await dataSource.manager.transaction(ISOLATION_LEVEL, async (em) => {
            return sqliteTransactionStorage.run(em, () => fn(em))
          })
          resolve(result)
        } catch (err) {
          reject(err)
        }
      })
    })
  }
  return dataSource.manager.transaction(ISOLATION_LEVEL, fn)
}

export function runInTransaction<T>(userId: string, runInTransaction: (entityManager: EntityManager) => Promise<T>): Promise<T> {
  return transactionOrReuse(async (entityManager) => {
    addUserToManager(entityManager, userId)
    return runInTransaction(entityManager)
  })
}
