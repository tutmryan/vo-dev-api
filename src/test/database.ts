import type { CommandContext } from '../cqs'
import { dataSource, ISOLATION_LEVEL } from '../data'
import { addUserToManager } from '../data/user-context-helper'
import { createDatabase, dropDatabase, dropExistingTestDatabases } from '../util/local-database-init'

export const setup = async () => {
  await dropExistingTestDatabases()
}

export const teardown = async () => {
  return Promise.resolve()
}

export const beforeAfterAll = () => {
  beforeAll(async () => {
    await createDatabase({ runMigrations: true })
    await dataSource.initialize()
  }, 1000 * 60)
  afterAll(async () => {
    await dataSource.destroy()
    await dropDatabase()
  }, 1000 * 10)
}

export function inTransaction<T>(
  fn: (entityManager: CommandContext['entityManager']) => Promise<T>,
  userId: string | undefined = undefined,
) {
  return dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
    if (userId) addUserToManager(entityManager, userId)
    return await fn(entityManager)
  })
}
