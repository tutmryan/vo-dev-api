import { dataSource } from '../data'
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
