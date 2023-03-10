import type { AzureFunction, Context } from '@azure/functions'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'

const httpTrigger: AzureFunction = async function (context: Context): Promise<void> {
  try {
    const { DATABASE_HOST: host, DATABASE_PORT: port, PRINCIPAL_NAME, PRINCIPAL_ID } = process.env
    if (!host || !port || !PRINCIPAL_NAME || !PRINCIPAL_ID) throw new Error('Missing environment variables')

    const principalId = context.req?.headers['X-MS-CLIENT-PRINCIPAL-ID']
    const principalName = context.req?.headers['X-MS-CLIENT-PRINCIPAL-NAME']

    if (!principalId || !principalName) {
      context.res = { status: 401 }
      return
    }
    if (principalId !== PRINCIPAL_ID || principalName !== PRINCIPAL_NAME) {
      context.res = { status: 403 }
      return
    }

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
    const dataSource = new DataSource(config)

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
  }
}

export default httpTrigger
