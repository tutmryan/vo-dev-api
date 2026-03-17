/**
 * ESLint rule: no-hardcoded-column-types
 *
 * Prevents using hardcoded MSSQL-specific column types in TypeORM entity decorators.
 * Use the cross-DB helpers from `crossDbColumnTypes` instead, so entities work in both
 * MSSQL (runtime) and SQLite (tests).
 */

const bannedTypes = {
  nvarchar: {
    replacement: 'nvarcharType',
    message: "Use 'nvarcharType' from crossDbColumnTypes instead of hardcoded 'nvarchar'.",
  },
  bit: {
    replacement: 'booleanType',
    message: "Use 'booleanType' from crossDbColumnTypes instead of hardcoded 'bit'.",
  },
  datetimeoffset: {
    replacement: 'dateTimeOffsetType',
    message: "Use 'dateTimeOffsetType' from crossDbColumnTypes instead of hardcoded 'datetimeoffset'.",
  },
  uniqueidentifier: {
    replacement: 'uuid',
    message: "Use 'uuid' instead of 'uniqueidentifier'. TypeORM maps 'uuid' correctly for both MSSQL and SQLite.",
  },
}

const columnDecorators = new Set(['Column', 'CreateDateColumn', 'UpdateDateColumn', 'DeleteDateColumn', 'PrimaryColumn'])

const transformerRequiredTypes = {
  dateTimeOffsetType: {
    transformer: 'dateTimeOffsetTransformer',
    message:
      "Columns with 'dateTimeOffsetType' must include the 'dateTimeOffsetTransformer' to ensure consistent Date handling across MSSQL and SQLite.",
  },
  datetimeoffset: {
    transformer: 'dateTimeOffsetTransformer',
    message:
      "Columns with 'datetimeoffset' must include the 'dateTimeOffsetTransformer' to ensure consistent Date handling across MSSQL and SQLite.",
  },
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded MSSQL column types in TypeORM decorators; use crossDbColumnTypes helpers instead',
    },
    messages: {
      bannedColumnType: '{{ message }}',
      bannedMaxLength: "Use 'varcharMaxLength' from crossDbColumnTypes instead of hardcoded 'MAX'. SQLite does not support 'MAX' length.",
      missingTransformer: '{{ message }}',
    },
    schema: [],
  },
  create(context) {
    return {
      // Match: @Column({ type: 'nvarchar' }) etc.
      CallExpression(node) {
        // Check the callee is one of the column decorators
        const calleeName = node.callee.type === 'Identifier' ? node.callee.name : undefined
        if (!calleeName || !columnDecorators.has(calleeName)) return

        // Find the options object argument (first object literal)
        const optionsArg = node.arguments.find((arg) => arg.type === 'ObjectExpression')
        if (!optionsArg) return

        // Find the `type` property
        const typeProp = optionsArg.properties.find(
          (prop) => prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'type',
        )
        if (!typeProp) return

        // Check if the value is a banned string literal
        if (typeProp.value.type === 'Literal' && typeof typeProp.value.value === 'string') {
          const banned = bannedTypes[typeProp.value.value]
          if (banned) {
            context.report({
              node: typeProp.value,
              messageId: 'bannedColumnType',
              data: { message: banned.message },
            })
          }
        }

        const transformerProp = optionsArg.properties.find(
          (prop) => prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'transformer',
        )

        const typeIdentifier =
          typeProp.value.type === 'Identifier'
            ? typeProp.value.name
            : typeProp.value.type === 'Literal' && typeof typeProp.value.value === 'string'
              ? typeProp.value.value
              : undefined

        if (typeIdentifier) {
          const transformerRule = transformerRequiredTypes[typeIdentifier]
          if (transformerRule && !transformerProp) {
            context.report({
              node: typeProp.value,
              messageId: 'missingTransformer',
              data: { message: transformerRule.message },
            })
          }
        }

        // Check for hardcoded length: 'MAX'
        const lengthProp = optionsArg.properties.find(
          (prop) => prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'length',
        )
        if (lengthProp && lengthProp.value.type === 'Literal' && lengthProp.value.value === 'MAX') {
          context.report({
            node: lengthProp.value,
            messageId: 'bannedMaxLength',
          })
        }
      },
    }
  },
}

export default rule
