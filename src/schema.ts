import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { applyMiddleware } from 'graphql-middleware'
import { resolvers as scalarResolvers, typeDefs as scalarTypeDefs } from 'graphql-scalars'
import path from 'path'
import { permissions } from './shield'

export default function () {
  const resolvers = loadFilesSync(path.join(__dirname, './features/**/resolvers.*'), { extensions: ['ts', 'js'] })
  const typeDefs = loadFilesSync<string>([
    path.join(__dirname, './features/**/schema.graphql'),
    path.join(__dirname, './schema/**/*.graphql'),
  ])

  let schema = makeExecutableSchema({
    typeDefs: mergeTypeDefs([scalarTypeDefs, ...typeDefs]),
    resolvers: mergeResolvers([scalarResolvers, ...resolvers]),
  })

  schema = applyMiddleware(schema, permissions)

  return schema
}
