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
import { verifyForHost } from '@makerx/express-bearer'
import { createLoggingPlugin, introspectionControlPlugin } from '@makerx/graphql-apollo-server'
import { useSubscriptionsServer } from '@makerx/graphql-core'
import { isProduction } from '@makerx/node-common'
import type { Express } from 'express'
import { json } from 'express'
import type { Disposable } from 'graphql-ws'
import type http from 'http'
import { newCacheSection } from './cache'
import config from './config'
import type { GraphQLContext } from './context'
import { createContext, createSubscriptionContext } from './context'
import { logger } from './logger'
import createSchema from './schema'

const plugins = (httpServer: http.Server, serverCleanup: Disposable): ApolloServerPlugin<GraphQLContext>[] => {
  const plugins: ApolloServerPlugin<GraphQLContext>[] = [
    createLoggingPlugin({}),
    introspectionControlPlugin as ApolloServerPlugin<GraphQLContext>,
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose()
          },
        }
      },
    },
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
  logger.info('Building schema')
  const schema = createSchema()

  logger.info('Initialising subscriptions websocket server')
  const wsServerCleanup = useSubscriptionsServer({
    schema,
    httpServer,
    logger,
    createSubscriptionContext,
    jwtClaimsToLog: config.get('logging.userClaimsToLog'),
    requireAuth: true,
    verifyToken: (host, token) => verifyForHost(host, token, config.get('auth.bearer')),
  })

  logger.info('Starting apollo server')
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: plugins(httpServer, wsServerCleanup),
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
