import { isLocalDev } from '@makerx/node-common'
import { createLogger } from '@makerx/node-winston'
import { pid } from 'node:process'
import type { Transform } from 'node:stream'
import type { LoggerOptions, QueryRunner, Logger as TypeOrmLoggerInterface } from 'typeorm'
import type { Logger as WinstonLogger } from 'winston'
import * as winston from 'winston'
import { logging } from './config'
import { auditService } from './services/audit-service'
import { redactValues } from './util/redact-values'

export type Logger = ReturnType<typeof createLogger> & { audit: winston.LeveledLogMethod } & Pick<WinstonLogger, 'isVerboseEnabled'>

export type LoggerWithMetaControl = Logger & { mergeMeta: (meta: object) => void }

// We duplicate type information here, but it's easier than having to cast everywhere, so the dev UX is better
declare module 'winston' {
  interface Logger {
    child(options: object): Pick<WinstonLogger, 'child' | 'debug' | 'error' | 'info' | 'verbose' | 'warn' | 'log' | 'isVerboseEnabled'> & {
      audit: winston.LeveledLogMethod
      mergeMeta: (meta: object) => void
    }
  }
}

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
    value: function ({ level, message, ...rest }: { level: any; message: any }) {
      const transform = baseLogger as unknown as Transform // A winston logger extends Transform stream
      const redactedValues = redactValues(rest, ...logging.redactPaths)

      transform.write(Object.assign({}, { logLevel: level, level: level === 'audit' ? 'info' : level, message }, redactedValues))

      if (level === 'audit') {
        auditService.log(message, redactedValues)
      }
    },
  },
  child: {
    value: function (meta: Record<string, any>) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const logger = this // capture this (parent logger) for use in write-value closure below

      return Object.create(logger, {
        mergeMeta: {
          value: function (additionalMeta: Record<string, any>) {
            Object.assign(meta, additionalMeta)
            return this
          },
        },
        write: {
          value: function (info: object) {
            const infoClone = Object.assign({}, meta, info)
            if (info instanceof Error) {
              infoClone.message = info.message
              infoClone.stack = info.stack
            }
            logger.write(infoClone)
          },
        },
      })
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
