import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeResolvers } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { stitchSchemas } from '@graphql-tools/stitch'
import type { GraphQLSchema } from 'graphql'
import { GraphQLError, GraphQLScalarType, Kind } from 'graphql'
import { constraintDirectiveDocumentation, constraintDirectiveTypeDefs } from 'graphql-constraint-directive'
import { applyMiddleware } from 'graphql-middleware'
import { resolvers as scalarResolvers } from 'graphql-scalars'
import { identityFunc } from 'graphql/jsutils/identityFunc'
import { pick } from 'lodash'
import path from 'path'
import { buildRemoteSchema } from './features/platform-management'
import { logger } from './logger'
import { permissions } from './shield'

const usedScalars = pick(
  scalarResolvers,
  'PositiveInt',
  'NonNegativeInt',
  'PositiveFloat',
  'URL',
  'DateTime',
  'Locale',
  'HexColorCode',
  'Void',
  'JSON',
  'JSONObject',
  'EmailAddress',
  'UUID',
)

const markdownScalar = {
  Markdown: new GraphQLScalarType({
    name: 'Markdown',
    serialize: (value) => String(value),
    parseValue: (value) => {
      if (value === null || value === undefined) return null
      if (typeof value !== 'string') {
        throw new GraphQLError('Markdown must be a string')
      }
      return value
    },
    parseLiteral: (ast) => {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError('Markdown must be a string')
      }
      return ast.value
    },
  }),
}

function buildLocalSchema() {
  const resolvers = loadFilesSync(
    [path.join(__dirname, './features/**/resolvers.*'), path.join(__dirname, './background-jobs/**/resolvers.*')],
    { extensions: ['ts', 'js'] },
  )
  const typeDefs = loadFilesSync<string>([
    path.join(__dirname, './background-jobs/**/schema.graphql'),
    path.join(__dirname, './features/**/schema.graphql'),
    path.join(__dirname, './schema/**/*.graphql'),
  ])

  let schema = makeExecutableSchema({
    typeDefs: [constraintDirectiveTypeDefs, typeDefs],
    resolvers: mergeResolvers([usedScalars, markdownScalar, ...resolvers]),
  })
  schema = constraintDirectiveDocumentation({})(schema)
  requireExplicitResolversForScalars(schema)

  const scalarsWithNoExplicitResolvers = Object.values(schema.getTypeMap())
    .filter((x) => x instanceof GraphQLScalarType)
    .map((x) => x as GraphQLScalarType)
    .filter((x) => x.parseValue === identityFunc && x.serialize === identityFunc)
    .map((x) => x.name)

  if (scalarsWithNoExplicitResolvers.length > 0) {
    throw new Error(`The following scalars have no explicit resolvers: ${scalarsWithNoExplicitResolvers.join(', ')}`)
  }

  const schemaWithShield = applyMiddleware(schema, permissions)
  return schemaWithShield
}

export default function () {
  const localSchema = buildLocalSchema()
  const platformManagementRemoteSchema = buildRemoteSchema()
  if (!platformManagementRemoteSchema) logger.warn('Platform Management remote schema is not configured in this environment')
  // when stitching schemas, apply the local schema last to ensure that scalar resolvers (validations) defined in the local schema take precedence
  return platformManagementRemoteSchema ? stitchSchemas({ subschemas: [platformManagementRemoteSchema, localSchema] }) : localSchema
}

function requireExplicitResolversForScalars(schema: GraphQLSchema) {
  const testSymbol = Symbol('testSymbol')
  const scalars = Object.values(schema.getTypeMap()).filter((t): t is GraphQLScalarType => t instanceof GraphQLScalarType)
  for (const scalar of scalars) {
    // Skip scalars that intentionally accept any value without validation
    if (scalar.name === 'Void' || scalar.name === 'JSON') continue
    try {
      scalar.parseValue(testSymbol)
    } catch {
      // We expect that a parser should not handle parsing a symbol
      continue
    }
    throw new Error(
      `Scalar ${scalar.name} does not appear to have an explicit resolver, or is not performing sufficient validation when parsing input`,
    )
  }
}
