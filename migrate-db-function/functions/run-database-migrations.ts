import { app, HttpResponse } from '@azure/functions'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'

app.http('RunDatabaseMigrations', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (_, context) => {
    let dataSource: DataSource | undefined = undefined

    try {
      const { DATABASE_HOST: host, DATABASE_PORT: port, APP_VERSION: version } = process.env
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

      return new HttpResponse({
        status: 200,
        jsonBody: { result: 'complete', migrations, version },
      })
    } catch ({ message, stack }: any) {
      context.error(`Error while running migrations`, message, stack)
      return new HttpResponse({
        status: 500,
        jsonBody: { result: 'failed', message, stack },
      })
    } finally {
      if (dataSource?.isInitialized) {
        await dataSource.destroy()
      }
    }
  },
})
