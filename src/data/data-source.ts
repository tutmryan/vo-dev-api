import { environment, isLocalDev } from '@makerxstudio/node-common'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'
import config from '../config'
import { logger, LoggerForTypeOrm } from '../logger'
import type { VerifiedOrchestrationEntityManager } from './entity-manager'
import { SnakeNamingStrategy } from './utils/snake-naming-strategy'
import { TrackingEventSubscriber } from '../features/tracking/tracking-event-subscriber'

const { logging, host, port, database } = config.get('database')

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
  migrations: ['migrate-db-function/migrations/**/*{.ts,.js}'],
  migrationsTransactionMode: 'each',
  namingStrategy: new SnakeNamingStrategy(),
  subscribers: [TrackingEventSubscriber],
}

const usernamePasswordAuthConfig: () => SqlServerConnectionOptions = () => {
  const { username, password } = config.get('database')
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
