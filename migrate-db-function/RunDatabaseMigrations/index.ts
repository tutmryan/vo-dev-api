import type { AzureFunction, Context } from '@azure/functions'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'

const httpTrigger: AzureFunction = async function (context: Context): Promise<void> {
  let dataSource: DataSource | undefined = undefined

  try {
    const { DATABASE_HOST: host, DATABASE_PORT: port } = process.env
    if (!host || !port) throw new Error('Missing environment variables DATABASE_HOST and/or DATABASE_PORT')

    const config: SqlServerConnectionOptions = {
      type: 'mssql',
      host,
      port: parseInt(port, 10),
      database: 'VerifiedOrchestration',
      synchronize: false,
      logging: true,
      entities: [''],
      migrations: ['migrations/**/*{.ts,.js}'],
      subscribers: [],
      authentication: {
        type: 'azure-active-directory-msi-app-service',
        options: {},
      },
    }
    dataSource = new DataSource(config)

    context.log('Initialising database connection')
    await dataSource.initialize()

    context.log('Running migration(s)')
    const migrations = await dataSource.runMigrations({
      transaction: 'each',
    })

    context.log('Complete ✅')
    for (const m of migrations) {
      context.log(`Executed migration: ${JSON.stringify(m, null, 4)}`)
    }

    context.res = { status: 200, body: JSON.stringify({ result: 'complete', migrations }, null, 4) }
  } catch ({ message, stack }) {
    context.res = { status: 500, body: JSON.stringify({ result: 'failed', message, stack }, null, 4) }
  } finally {
    await dataSource?.destroy()
  }
}

export default httpTrigger
