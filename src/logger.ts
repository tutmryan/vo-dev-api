import type { Logger } from '@makerxstudio/node-common'
import { isLocalDev } from '@makerxstudio/node-common'
import { createLogger } from '@makerxstudio/node-winston'
import type { Logger as TypeOrmLoggerInterface, LoggerOptions, QueryRunner } from 'typeorm'
import config from './config'

export const logger = createLogger({
  consoleFormat: isLocalDev ? 'pretty' : 'json',
  consoleOptions: config.get('logging.consoleOptions'),
  loggerOptions: config.get('logging.loggerOptions'),
  omitPaths: config.get('logging.omitPaths'),
})

export class LoggerForTypeOrm implements TypeOrmLoggerInterface {
  constructor(private options: LoggerOptions, private logger: Logger) {}

  private shouldLog(logType: 'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration') {
    return this.options === true || this.options === 'all' || (Array.isArray(this.options) && this.options.includes(logType))
  }

  log(level: 'log' | 'info' | 'warn', message: any, _queryRunner?: QueryRunner): any {
    if (!this.shouldLog(level)) return
    logger.log(level, message)
  }

  logMigration(message: string, _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('migration')) return
    logger.info('db migration', { message })
  }

  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('query')) return
    logger.verbose('db query', { query, parameters })
  }

  logQueryError(error: string | Error, query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('error')) return
    logger.error('db query error', { query, parameters, error })
  }

  logQuerySlow(time: number, query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('query')) return
    logger.warn('db query slow', { query, parameters, time })
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('schema')) return
    logger.info('db schema build', { message })
  }
}
