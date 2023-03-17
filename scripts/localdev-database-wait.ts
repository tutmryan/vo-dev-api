import { tryConnect } from '../src/util/local-database-init'

tryConnect(20_000)
  .then(async (pool) => {
    console.log('Database is ready ✅')
    await pool.close()
  })
  .catch(console.log)
