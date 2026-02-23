import { isLocalDev } from '@makerx/node-common'
import { createDatabase, tryConnect } from '../src/util/local-database-init'

if (!isLocalDev && process.env.TEST_DATA_MIGRATION_DRIFT !== 'true') {
  console.error('Database setup is only for localdev ❌')
  process.exit(1)
}

const handleError = (error: Error) => {
  console.error(error)
  process.exit(1)
}

tryConnect(20_000)
  .then(async (pool) => {
    const database = await pool.query`SELECT * FROM sys.databases WHERE name = N'VerifiedOrchestration'`
    await pool.close()

    if (database.recordset.length) {
      console.log('Database already exists ✅')
      process.exit()
    }

    await createDatabase({ runMigrations: false })
    console.log('Database initialised ✅')
  })
  .catch(handleError)
