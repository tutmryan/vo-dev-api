import type { ConnectionPool } from 'mssql'
import { connect } from 'mssql'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'
import { database as databaseConfig } from '../config'
import { dataSourceConfig } from '../data'
import { invariant } from './invariant'
import { wait } from './wait'

const isTest = process.env.NODE_ENV === 'test' && process.env.TEST_DATA_MIGRATION_DRIFT !== 'true'

process.env.HOME_TENANT_ID ||= '11111111-1111-1111-1111-111111111111'
process.env.HOME_TENANT_NAME ||= 'Test Home Tenant'

export const createDatabase = async ({ runMigrations }: { runMigrations?: boolean } = {}) => {
  if (isTest) return

  const saMasterDataSource = new DataSource({ ...(dataSourceConfig as SqlServerConnectionOptions), database: 'master', username: 'sa' })
  await saMasterDataSource.initialize()
  await saMasterDataSource.query(`CREATE DATABASE ${(dataSourceConfig as SqlServerConnectionOptions).database}`)
  await saMasterDataSource.query(`
    IF NOT EXISTS
      (SELECT name
      FROM master.sys.server_principals
      WHERE name = 'api_user')
    BEGIN
      CREATE LOGIN [api_user] WITH PASSWORD = N'${(dataSourceConfig as SqlServerConnectionOptions).password}'
    END
  `)
  await saMasterDataSource.destroy()

  const saDataSource = new DataSource({ ...(dataSourceConfig as SqlServerConnectionOptions), username: 'sa' })
  await saDataSource.initialize()

  await saDataSource.query(`CREATE USER [api_user] FOR LOGIN [api_user]`)
  await saDataSource.query(`EXEC sp_addrolemember N'db_datareader', N'api_user'`)
  await saDataSource.query(`EXEC sp_addrolemember N'db_datawriter', N'api_user'`)

  if (runMigrations)
    await saDataSource.runMigrations({
      transaction: 'each',
    })

  await saDataSource.destroy()
}

export const dropExistingTestDatabases = async () => {
  if (isTest) return

  const saMasterDataSource = new DataSource({ ...(dataSourceConfig as SqlServerConnectionOptions), database: 'master', username: 'sa' })
  await saMasterDataSource.initialize()

  invariant(databaseConfig.database.endsWith('_test'), 'Refusing to drop non-test databases')
  const result = await saMasterDataSource.query(`SELECT name FROM sys.databases WHERE name LIKE '${databaseConfig.database}_%'`)
  for (const row of result) {
    const dbName = row.name
    await saMasterDataSource.query(`DROP DATABASE IF EXISTS ${dbName}`)
  }
}

export const dropDatabase = async () => {
  if (isTest) return

  const saMasterDataSource = new DataSource({ ...(dataSourceConfig as SqlServerConnectionOptions), database: 'master', username: 'sa' })
  await saMasterDataSource.initialize()

  await saMasterDataSource.query(`DROP DATABASE IF EXISTS ${(dataSourceConfig as SqlServerConnectionOptions).database}`)
  await saMasterDataSource.destroy()
}

export const tryConnect = async (timeout: number): Promise<ConnectionPool> => {
  const now = Date.now()
  let lastError: unknown
  while (Date.now() - now < timeout) {
    try {
      return await connect(
        `Server=${(dataSourceConfig as SqlServerConnectionOptions).host},${(dataSourceConfig as SqlServerConnectionOptions).port};Database=master;User Id=sa;Password=${(dataSourceConfig as SqlServerConnectionOptions).password};Encrypt=true;TrustServerCertificate=True`,
      )
    } catch (error) {
      lastError = error
      await wait(1_000)
    }
  }
  throw lastError ?? new Error('Could not connect to database')
}
