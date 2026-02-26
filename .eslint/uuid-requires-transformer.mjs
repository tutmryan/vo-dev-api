/**
 * ESLint rule: uuid-requires-transformer
 *
 * Ensures that columns with type 'uuid' include a transformer (typically uuidLowerCaseTransformer)
 * so that UUID values are consistently lowercased.
 */

const columnDecorators = new Set(['Column', 'CreateDateColumn', 'UpdateDateColumn', 'PrimaryColumn'])

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: "Require a 'transformer' option on columns with type 'uuid'",
    },
    messages: {
      missingTransformer: "Columns with type 'uuid' must include a 'transformer' (e.g. uuidLowerCaseTransformer).",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const calleeName = node.callee.type === 'Identifier' ? node.callee.name : undefined
        if (!calleeName || !columnDecorators.has(calleeName)) return

        const optionsArg = node.arguments.find((arg) => arg.type === 'ObjectExpression')
        if (!optionsArg) return

        const typeProp = optionsArg.properties.find(
          (prop) => prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'type',
        )
        if (!typeProp) return

        // Only check columns with type: 'uuid'
        if (typeProp.value.type !== 'Literal' || typeProp.value.value !== 'uuid') return

        const hasTransformer = optionsArg.properties.some(
          (prop) => prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'transformer',
        )

        if (!hasTransformer) {
          context.report({
            node: typeProp.value,
            messageId: 'missingTransformer',
          })
        }
      },
    }
  },
}

export default rule
