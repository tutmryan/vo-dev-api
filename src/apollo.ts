import type { ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server'
import { ApolloServer } from '@apollo/server'
import responseCachePlugin from '@apollo/server-plugin-response-cache'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace'
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default'
import { createLoggingPlugin, introspectionControlPlugin } from '@makerxstudio/graphql-apollo-server'
import { isProduction } from '@makerxstudio/node-common'
import type { Express } from 'express'
import { json } from 'express'
import type http from 'http'
import { newCacheSection } from './cache'
import type { GraphQLContext } from './context'
import { createContext } from './context'
import { logger } from './logger'
import schema from './schema'

const plugins = (httpServer: http.Server): ApolloServerPlugin<GraphQLContext>[] => {
  const plugins: ApolloServerPlugin<GraphQLContext>[] = [
    createLoggingPlugin({}),
    introspectionControlPlugin as ApolloServerPlugin<GraphQLContext>,
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginCacheControl({ defaultMaxAge: 0 }),
    responseCachePlugin({
      cache: newCacheSection('apollo'),
      sessionId: (requestContext: GraphQLRequestContext<GraphQLContext>) => Promise.resolve(requestContext.contextValue.user?.id ?? null),
    }),
  ]
  if (!isProduction) {
    plugins.push(ApolloServerPluginInlineTrace())
  }
  plugins.push(
    isProduction
      ? ApolloServerPluginLandingPageProductionDefault()
      : ApolloServerPluginLandingPageLocalDefault({ embed: true, includeCookies: true }),
  )
  return plugins
}

export const startApolloServer = async (app: Express, httpServer: http.Server) => {
  logger.info('Starting apollo server')

  const server = new ApolloServer<GraphQLContext>({
    schema: schema(),
    plugins: plugins(httpServer),
    introspection: true,
    csrfPrevention: true,
  })
  await server.start()

  app.use(
    '/graphql',
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext({ req, claims: req.user }),
    }),
  )
}
