import { environment, isLocalDev } from '@makerx/node-common'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'
import { database as databaseConfig } from '../config'
import { AuditingEventSubscriber } from '../features/auditing/auditing-event-subscribers'
import { TrackingEventSubscriber } from '../features/auditing/tracking-event-subscriber'
import { LoggerForTypeOrm, logger } from '../logger'
import { randomDigits } from '../util/random-digits'
import type { VerifiedOrchestrationEntityManager } from './entity-manager'
import { SnakeNamingStrategy } from './utils/snake-naming-strategy'

const { logging, host, port } = databaseConfig
let { database } = databaseConfig

if (process.env.NODE_ENV === 'test' && process.env.TEST_DATA_MIGRATION_DRIFT !== 'true') {
  database = `${database}_${randomDigits(6)}`
}

const baseConfig: Pick<
  SqlServerConnectionOptions,
  | 'type'
  | 'synchronize'
  | 'logger'
  | 'entities'
  | 'migrations'
  | 'migrationsTransactionMode'
  | 'namingStrategy'
  | 'host'
  | 'port'
  | 'database'
  | 'subscribers'
> = {
  type: 'mssql',
  host,
  port,
  database,
  synchronize: false,
  logger: new LoggerForTypeOrm(logging, logger),
  entities: ['src/**/entities/*{.ts,.js}'],
  migrations: ['migrate-db/migrations/**/*{.ts,.js}'],
  migrationsTransactionMode: 'each',
  namingStrategy: new SnakeNamingStrategy(),
  subscribers: [TrackingEventSubscriber, AuditingEventSubscriber],
}

const usernamePasswordAuthConfig: () => SqlServerConnectionOptions = () => {
  const { username, password } = databaseConfig
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

const aadAuthConfig: () => SqlServerConnectionOptions = () => {
  return {
    ...baseConfig,
    authentication: {
      type: 'azure-active-directory-msi-app-service',
      options: {},
    },
  }
}

export const dataSourceConfig: SqlServerConnectionOptions =
  isLocalDev || environment === 'test' ? usernamePasswordAuthConfig() : aadAuthConfig()
export const dataSource = new DataSource(dataSourceConfig)
export const entityManager = dataSource.manager as VerifiedOrchestrationEntityManager
