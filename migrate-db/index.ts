/* eslint-disable no-console */
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions.js'

type BaseConfig = Pick<
  SqlServerConnectionOptions,
  'type' | 'synchronize' | 'logging' | 'entities' | 'migrations' | 'host' | 'port' | 'database' | 'subscribers'
>

const { DATABASE_HOST: host, DATABASE_NAME: database } = process.env
const baseConfig: BaseConfig = {
  type: 'mssql',
  host,
  port: 1433,
  database,
  synchronize: false,
  logging: true,
  entities: [''],
  migrations: ['migrations/**/*{.ts,.js}'],
  subscribers: [],
}

function usernamePasswordAuthConfig(baseConfig: BaseConfig): SqlServerConnectionOptions {
  const { DATABASE_USERNAME: username, DATABASE_PASSWORD: password } = process.env
  return {
    ...baseConfig,
    username,
    password,
    extra: {
      options: {
        trustServerCertificate: true,
      },
    },
  }
}

const aadAuthConfig: (baseConfig: BaseConfig) => SqlServerConnectionOptions = () => {
  return {
    ...baseConfig,
    authentication: {
      type: 'azure-active-directory-default',
      options: {},
    },
  }
}

const config = baseConfig.host === 'localhost' ? usernamePasswordAuthConfig(baseConfig) : aadAuthConfig(baseConfig)
const dataSource = new DataSource(config)

async function createExternalUser(user: string, roles: string[]) {
  const queryRunner = dataSource.createQueryRunner()

  const [{ count }] = await queryRunner.query(`SELECT COUNT(*) as count FROM sys.database_principals WHERE name = @0`, [user])
  if (count > 0) {
    console.log(`External user ${user} already exists ✅`)
  } else {
    console.log(`Creating external user ${user}`)
    await queryRunner.query(`CREATE USER [${user}] FROM EXTERNAL PROVIDER`) // create user cannot be paramaterised 👎
  }

  console.log(`Assigning user ${user} roles: ${roles.join(', ')}`)

  for (const role of roles) {
    await queryRunner.query(`ALTER ROLE [${role}] ADD MEMBER [${user}]`)
  }
}

async function run() {
  console.log('Initialising database connection')
  await dataSource.initialize()

  console.log('Running migration(s)')
  const migrations = await dataSource.runMigrations({
    transaction: 'each',
  })

  for (const m of migrations) {
    console.log(`Executed migration: ${JSON.stringify(m, null, 4)}`)
  }

  const { CREATE_EXTERNAL_USER: user } = process.env
  if (user) await createExternalUser(user, ['db_datareader', 'db_datawriter'])
}

run()
  .then(() => {
    console.log('Complete ✅')
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    console.log('Error ❌')
    process.exit(1)
  })
  .finally(async () => {
    if (dataSource.isInitialized) await dataSource.destroy()
  })
