import { DefaultNamingStrategy } from 'typeorm'
import { snakeCase } from 'typeorm/util/StringUtils'
import type { Table } from 'typeorm/schema-builder/table/Table'
import { isDefined } from '../../util/is-defined'

const getNameOfTable = (tableOrName: string | Table) => (typeof tableOrName === 'string' ? tableOrName : tableOrName.name)

const snakeCaseAndTrim = (...values: Array<string | undefined>) => snakeCase(values.filter(isDefined).join('_')).substring(0, 63)

export class SnakeNamingStrategy extends DefaultNamingStrategy {
  name = 'snake_case'

  columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string {
    const name = customName || snakeCase(propertyName)
    if (embeddedPrefixes.length) {
      return snakeCase(embeddedPrefixes.join('_')) + name
    }
    return name
  }

  relationName(propertyName: string): string {
    return snakeCaseAndTrim(propertyName)
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCaseAndTrim(relationName, referencedColumnName)
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return snakeCaseAndTrim(tableName, columnName ? columnName : propertyName)
  }

  primaryKeyName(tableOrName: Table | string, _columnNames: string[]): string {
    return snakeCaseAndTrim('id', getNameOfTable(tableOrName))
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return snakeCaseAndTrim('uq', getNameOfTable(tableOrName), ...columnNames)
  }
  relationConstraintName(tableOrName: Table | string, columnNames: string[], _where?: string): string {
    return snakeCaseAndTrim('rel', getNameOfTable(tableOrName), ...columnNames)
  }

  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    _referencedTablePath?: string,
    _referencedColumnNames?: string[],
  ): string {
    return snakeCaseAndTrim('fk', getNameOfTable(tableOrName), _referencedTablePath, ...columnNames)
  }

  indexName(tableOrName: Table | string, columnNames: string[], _where?: string): string {
    return snakeCaseAndTrim('ix', getNameOfTable(tableOrName), ...columnNames)
  }
}
