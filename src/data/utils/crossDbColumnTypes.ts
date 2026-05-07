import type { ColumnType } from 'typeorm'
import type { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer'

export const isTestSqlite = process.env.NODE_ENV === 'test' && process.env.TEST_DATA_MIGRATION_DRIFT !== 'true'

export const dateTimeOffsetType: ColumnType = isTestSqlite ? 'datetime' : 'datetimeoffset'

export const dateTimeOffsetTransformer: ValueTransformer = {
  from: (dbValue: string | Date | null): Date | null => {
    if (dbValue == null) return null
    if (dbValue instanceof Date) return dbValue
    return new Date(dbValue.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dbValue) ? dbValue : `${dbValue}Z`)
  },
  to: (entityValue: Date | null): Date | null => entityValue,
}

export const nvarcharType: ColumnType = isTestSqlite ? 'varchar' : 'nvarchar'

export const nvarcharMaxType: ColumnType = isTestSqlite ? 'text' : 'nvarchar'
export const varcharMaxLength = isTestSqlite ? undefined : ('MAX' as const)

export const booleanType: ColumnType = isTestSqlite ? 'boolean' : 'bit'
