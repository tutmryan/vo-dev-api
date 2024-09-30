import type { CommandContext } from '../cqs'
import { dataSource, ISOLATION_LEVEL } from '../data'
import { addUserToManager } from '../features/auditing/user-context-helper'
import { createDatabase, dropDatabase } from '../util/local-database-init'

export const setup = async () => {
  await dropDatabase()
  await createDatabase({ runMigrations: true })
}

export const teardown = async () => {
  return Promise.resolve()
}

export const beforeAfterAll = () => {
  beforeAll(async () => {
    await dataSource.initialize()
  })
  afterAll(async () => {
    await dataSource.destroy()
  })
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
