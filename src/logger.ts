import { isLocalDev } from '@makerx/node-common'
import { createLogger } from '@makerx/node-winston'
import { pid } from 'node:process'
import type { LoggerOptions, QueryRunner, Logger as TypeOrmLoggerInterface } from 'typeorm'
import type { Logger as WinstonLogger } from 'winston'
import * as winston from 'winston'
import { logging } from './config'
import { redactValues } from './util/redact-values'

/**
 * set up 'audit' log level, replacing 'http' level
 */
export type Logger = ReturnType<typeof createLogger> & { audit: winston.LeveledLogMethod } & Pick<WinstonLogger, 'isVerboseEnabled'>

const logLevels = {
  audit: 0, // Audit logs must always be captured
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
}

const logColours: Record<keyof typeof logLevels, string> = {
  audit: 'green',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'cyan',
  silly: 'magenta',
}

// configure colors
winston.addColors({ ...logColours })

const baseLogger = createLogger({
  consoleFormat: isLocalDev ? 'pretty' : 'json',
  consoleOptions: logging.consoleOptions,
  loggerOptions: { ...logging.loggerOptions, levels: logLevels, defaultMeta: { pid } },
  omitPaths: logging.omitPaths,
}) as Logger

/**
 * When records are sent to Azure Monitor, the level is converted to the Azure Monitor severity level, so we lose the original log level fidelity.
 * To work around this, add a `logLevel` property to the record and set it to the same value as the `level` property.
 * Azure Monitor won't handle the custom 'audit' log level, so we map it to 'info'.
 * We can then filter logs using the `logLevel` property instead.
 * Implementation as per logger.child() winston/lib/winston/logger.js
 */
export const logger: Logger = Object.create(baseLogger, {
  write: {
    value: function ({ level, ...rest }: { level: any }) {
      const transform = baseLogger as any
      transform.write(
        Object.assign({}, { logLevel: level, level: level === 'audit' ? 'info' : level }, redactValues(rest, ...logging.redactPaths)),
      )
    },
  },
})

export class LoggerForTypeOrm implements TypeOrmLoggerInterface {
  constructor(
    private options: LoggerOptions,
    private logger: Logger,
  ) {}

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
