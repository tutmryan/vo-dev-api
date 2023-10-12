import { isLocalDev } from '@makerx/node-common'
import { createLogger } from '@makerx/node-winston'
import { configs } from 'triple-beam'
import type { LoggerOptions, QueryRunner, Logger as TypeOrmLoggerInterface } from 'typeorm'
import * as winston from 'winston'
import config from './config'

/**
 * set up 'audit' log level, replacing 'http' level
 */
export type Logger = ReturnType<typeof createLogger> & { audit: winston.LeveledLogMethod }
// extract http from levels and colors
const { http: httpLevel, ...levelsRest } = configs.npm.levels
const { http: httpColor, ...colorsRest } = configs.npm.colors
// configure levels
export const levels: winston.config.AbstractConfigSetLevels & { audit: number } = { ...levelsRest, audit: httpLevel as number }
// configure colors
winston.addColors({ ...colorsRest, audit: httpColor as string })

export const logger = createLogger({
  consoleFormat: isLocalDev ? 'pretty' : 'json',
  consoleOptions: config.get('logging.consoleOptions'),
  loggerOptions: { ...config.get('logging.loggerOptions'), levels },
  omitPaths: config.get('logging.omitPaths'),
}) as Logger

export class LoggerForTypeOrm implements TypeOrmLoggerInterface {
  constructor(private options: LoggerOptions, private logger: Logger) {}

  private shouldLog(logType: 'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration') {
    return this.options === true || this.options === 'all' || (Array.isArray(this.options) && this.options.includes(logType))
  }

  log(level: 'log' | 'info' | 'warn', message: any, _queryRunner?: QueryRunner): any {
    if (!this.shouldLog(level)) return
    this.logger[level === 'log' ? 'info' : level](message)
  }

  logMigration(message: string, _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('migration')) return
    this.logger.info('db migration', { message })
  }

  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('query')) return
    this.logger.verbose('db query', { query, parameters })
  }

  logQueryError(error: string | Error, query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('error')) return
    this.logger.error('db query error', { query, parameters, error })
  }

  logQuerySlow(time: number, query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('query')) return
    this.logger.warn('db query slow', { query, parameters, time })
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner): any {
    if (!this.shouldLog('schema')) return
    this.logger.info('db schema build', { message })
  }
}
