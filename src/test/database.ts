import type { CommandContext } from '../cqs'
import { dataSource, transactionOrReuse } from '../data'
import { isSqlite } from '../data/data-source'
import { addUserToManager } from '../data/user-context-helper'
import { SYSTEM_USER_ID, UserEntity } from '../features/users/entities/user-entity'
import { createDatabase, dropDatabase, dropExistingTestDatabases } from '../util/local-database-init'

export const setup = async () => {
  await dropExistingTestDatabases()
}

export const teardown = async () => {
  return Promise.resolve()
}

export const beforeAfterAll = () => {
  beforeAll(async () => {
    await createDatabase({ runMigrations: false })
    await dataSource.initialize()
    if (isSqlite) {
      // Seed the system user so that audit trail FK references are satisfied.
      // The entity id must match SYSTEM_USER_ID because addUserToManager passes it as the userId
      // and the audit subscriber inserts it as user_id in audit tables (which FK to user.id).
      const userRepo = dataSource.getRepository(UserEntity)
      const systemUser = await userRepo.findOneBy({ id: SYSTEM_USER_ID })
      if (!systemUser) {
        const entity = new UserEntity({ oid: SYSTEM_USER_ID, tenantId: SYSTEM_USER_ID, email: null, name: 'System', isApp: true })
        entity.id = SYSTEM_USER_ID
        await userRepo.save(entity)
      }
      // Re-enable FK constraints now that schema sync is complete.
      // They are off by default in SQLite; synchronize needs them off to create tables in any order.
      await dataSource.query('PRAGMA foreign_keys = ON')
    }
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
  return transactionOrReuse(async (entityManager) => {
    if (userId) addUserToManager(entityManager, userId)
    return await fn(entityManager)
  })
}
