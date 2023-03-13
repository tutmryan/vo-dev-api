import { isLocalDev } from '@makerxstudio/node-common'
import { connect } from 'mssql'
import { wait } from '../src/util/wait'
import { ConnectionPool } from 'mssql'

if (!isLocalDev) {
  console.error('Database setup is only for localdev ❌')
  process.exit(1)
}

const handleError = (error: Error) => {
  console.error(error)
  process.exit(1)
}

const openPool = () =>
  connect('Server=localhost,1433;Database=master;User Id=sa;Password=7o}R~=XA1jmz!-aHQ^pA;Encrypt=true;TrustServerCertificate=True')

const tryConnect = async (timeout: number): Promise<ConnectionPool> => {
  const now = Date.now()
  let lastError: unknown
  while (Date.now() - now < timeout) {
    try {
      const pool = await openPool()
      return pool
    } catch (error) {
      lastError = error
      console.warn('Could not connect to database, retrying in 1s...')
      await wait(1_000)
    }
  }
  throw lastError ?? new Error('Could not connect to database ❌')
}

tryConnect(20_000)
  .then(async (pool) => {
    const logAndFinish = (...args: Parameters<typeof console.log>) => {
      console.log(...args)
      pool.close()
      process.exit(0)
    }

    const database = await pool.query`SELECT * FROM sys.databases WHERE name = N'VerifiedOrchestration'`
    if (database.recordset.length) logAndFinish('Database already exists ✅')

    await pool.query`CREATE DATABASE VerifiedOrchestration`
    await pool.query`CREATE LOGIN api_user WITH PASSWORD = '7o}R~=XA1jmz!-aHQ^pA'`
    await pool.query`USE VerifiedOrchestration`
    await pool.query`CREATE USER [api_user] FOR LOGIN [api_user]`
    await pool.query`EXEC sp_addrolemember N'db_datareader', N'api_user'`
    await pool.query`EXEC sp_addrolemember N'db_datawriter', N'api_user'`

    logAndFinish('Database initialised ✅')
  })
  .catch(handleError)
