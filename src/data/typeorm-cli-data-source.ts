import config from 'config'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'
import { SnakeNamingStrategy } from './utils/snake-naming-strategy'

const host = process.env.DATABASE_HOST ?? (config.has('database.host') ? (config.get<string>('database.host') as string) : 'localhost')

const port = process.env.DATABASE_PORT
  ? Number(process.env.DATABASE_PORT)
  : config.has('database.port')
    ? (config.get<number>('database.port') as number)
    : 1433

const database =
  process.env.DATABASE_NAME ??
  (config.has('database.database') ? (config.get<string>('database.database') as string) : 'VerifiedOrchestration')

const username =
  process.env.DATABASE_USERNAME ?? (config.has('database.username') ? (config.get<string>('database.username') as string) : undefined)

const password =
  process.env.DATABASE_PASSWORD ?? (config.has('database.password') ? (config.get<string>('database.password') as string) : undefined)

const options: SqlServerConnectionOptions = {
  type: 'mssql',
  host,
  port,
  database,
  username,
  password,
  synchronize: false,
  entities: ['src/**/entities/*{.ts,.js}'],
  migrations: ['migrate-db/migrations/**/*{.ts,.js}'],
  migrationsTransactionMode: 'each',
  namingStrategy: new SnakeNamingStrategy(),
  extra: {
    options: {
      trustServerCertificate: true,
    },
  },
}

export default new DataSource(options)
