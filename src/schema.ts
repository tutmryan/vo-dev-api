import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeResolvers } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import type { GraphQLSchema } from 'graphql'
import { GraphQLScalarType } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { resolvers as scalarResolvers } from 'graphql-scalars'
import { identityFunc } from 'graphql/jsutils/identityFunc'
import { pick } from 'lodash'
import path from 'path'
import { permissions } from './shield'

export default function () {
  const resolvers = loadFilesSync(path.join(__dirname, './features/**/resolvers.*'), { extensions: ['ts', 'js'] })
  const typeDefs = loadFilesSync<string>([
    path.join(__dirname, './features/**/schema.graphql'),
    path.join(__dirname, './schema/**/*.graphql'),
  ])

  const usedScalars = pick(scalarResolvers, 'PositiveInt', 'URL', 'DateTime', 'Locale', 'HexColorCode', 'Void', 'JSONObject')

  let schema = makeExecutableSchema({
    typeDefs,
    resolvers: mergeResolvers([usedScalars, ...resolvers]),
  })

  requireExplicitResolversForScalars(schema)

  const scalarsWithNoExplicitResolvers = Object.values(schema.getTypeMap())
    .filter((x) => x instanceof GraphQLScalarType)
    .map((x) => x as GraphQLScalarType)
    .filter((x) => x.parseValue === identityFunc && x.serialize === identityFunc)
    .map((x) => x.name)

  if (scalarsWithNoExplicitResolvers.length > 0) {
    throw new Error(`The following scalars have no explicit resolvers: ${scalarsWithNoExplicitResolvers.join(', ')}`)
  }

  schema = applyMiddleware(schema, permissions)

  return schema
}

function requireExplicitResolversForScalars(schema: GraphQLSchema) {
  const testSymbol = Symbol('testSymbol')
  const scalars = Object.values(schema.getTypeMap()).filter((t): t is GraphQLScalarType => t instanceof GraphQLScalarType)
  for (const scalar of scalars) {
    if (scalar.name === 'Void') continue
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
