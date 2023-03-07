import 'reflect-metadata'
import { DataSource } from 'typeorm'
import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions'
import config from '../config'
import { logger, LoggerForTypeOrm } from '../logger'
import type { VerifiedOrchestrationEntityManager } from './entity-manager'
import { SnakeNamingStrategy } from './utils/snake-naming-strategy'

const { host, port, database, username, password, logging } = config.get('database')

export const dataSourceConfig: SqlServerConnectionOptions = {
  type: 'mssql',
  host,
  port,
  database,
  username,
  password,
  synchronize: false,
  logger: new LoggerForTypeOrm(logging, logger),
  entities: ['src/**/entities/*{.ts,.js}'],
  migrations: ['migrate-db-lambda/migrations/**/*{.ts,.js}'],
  migrationsTransactionMode: 'each',
  namingStrategy: new SnakeNamingStrategy(),
  extra: {
    options: {
      trustServerCertificate: true,
    },
  },
}

export const dataSource = new DataSource(dataSourceConfig)
export const entityManager = dataSource.manager as VerifiedOrchestrationEntityManager
