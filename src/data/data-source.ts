import { isLocalDev } from '@makerxstudio/node-common'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'
import config from '../config'
import { logger, LoggerForTypeOrm } from '../logger'
import type { VerifiedOrchestrationEntityManager } from './entity-manager'
import { SnakeNamingStrategy } from './utils/snake-naming-strategy'

const { logging } = config.get('database')

const baseConfig: Pick<
  SqlServerConnectionOptions,
  'type' | 'synchronize' | 'logger' | 'entities' | 'migrations' | 'migrationsTransactionMode' | 'namingStrategy'
> = {
  type: 'mssql',
  synchronize: false,
  logger: new LoggerForTypeOrm(logging, logger),
  entities: ['src/**/entities/*{.ts,.js}'],
  migrations: ['migrate-db-function/migrations/**/*{.ts,.js}'],
  migrationsTransactionMode: 'each',
  namingStrategy: new SnakeNamingStrategy(),
}

const localdevConfig: () => SqlServerConnectionOptions = () => {
  const { host, port, database, username, password } = config.get('database')
  return {
    ...baseConfig,
    host,
    port,
    database,
    username,
    password,
    extra: {
      options: {
        trustServerCertificate: true,
      },
    },
  }
}

const hostedConfig: () => SqlServerConnectionOptions = () => {
  const { host, port } = config.get('database')
  return {
    ...baseConfig,
    host,
    port,
    authentication: {
      type: 'azure-active-directory-msi-app-service',
      options: {},
    },
  }
}

export const dataSourceConfig: SqlServerConnectionOptions = isLocalDev ? localdevConfig() : hostedConfig()
export const dataSource = new DataSource(dataSourceConfig)
export const entityManager = dataSource.manager as VerifiedOrchestrationEntityManager
