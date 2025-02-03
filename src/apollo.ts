import type { ApolloServerPlugin } from '@apollo/server'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { verifyMultiIssuer } from '@makerx/express-bearer'
import { graphqlOperationLoggingPlugin } from '@makerx/graphql-apollo-server'
import { isIntrospectionQuery } from '@makerx/graphql-core'
import { useSubscriptionsServer } from '@makerx/graphql-core/subscriptions'
import { isProduction } from '@makerx/node-common'
import type { Express } from 'express'
import { json } from 'express'
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4'
import type http from 'http'
import { devToolsEnabled, issuerOptions, logging } from './config'
import type { GraphQLContext } from './context'
import { createContext, createSubscriptionContext } from './context'
import type { Logger } from './logger'
import { logger } from './logger'
import { rateLimiterMiddleware } from './rate-limiter'
import createSchema from './schema'
import { pruneKeys } from './util/prune-keys'

export const disableIntrospectionForAnonymousUsers: ApolloServerPlugin<GraphQLContext> = {
  requestDidStart: ({ request: { query }, contextValue: { user } }) => {
    if (isIntrospectionQuery(query) && !user) throw new Error('Unauthenticated introspection is not supported')
    return Promise.resolve()
  },
}

const plugins = (httpServer: http.Server, serverCleanup?: () => Promise<void>): ApolloServerPlugin<GraphQLContext>[] => {
  const plugins: ApolloServerPlugin<GraphQLContext>[] = [
    graphqlOperationLoggingPlugin<GraphQLContext, Logger>({
      logLevel: 'audit',
      contextCreationFailureLogger: logger,
      includeMutationResponseData: true,
      adjustVariables: (variables) => pruneKeys(variables, 'headers'),
    }),
    disableIntrospectionForAnonymousUsers,
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup?.()
          },
        }
      },
    },
  ]
  if (!isProduction) {
    plugins.push(ApolloServerPluginInlineTrace())
  }

  plugins.push(
    devToolsEnabled
      ? ApolloServerPluginLandingPageLocalDefault({ embed: true, includeCookies: true })
      : ApolloServerPluginLandingPageDisabled(),
  )

  plugins.push(createApollo4QueryValidationPlugin())
  return plugins
}

export const startApolloServer = async (app: Express, httpServer: http.Server, ...serverCleanup: Array<() => Promise<any>>) => {
  logger.info('Building schema')
  const schema = createSchema()

  logger.info('Initialising subscriptions websocket server')
  const wsServerCleanup = useSubscriptionsServer({
    logger,
    operationLogLevel: 'audit',
    schema,
    httpServer,
    createSubscriptionContext,
    jwtClaimsToLog: logging.userClaimsToLog,
    requireAuth: true,
    verifyToken: (host, token) => verifyMultiIssuer(host, token, { issuerOptions }),
  })

  logger.info('Starting apollo server')
  const server = new ApolloServer<GraphQLContext>({
    logger,
    schema,
    plugins: plugins(httpServer, async () => {
      await Promise.all([wsServerCleanup.dispose(), ...serverCleanup.map((cleanup) => cleanup())])
    }),
    introspection: devToolsEnabled,
    csrfPrevention: true,
  })
  await server.start()

  app.use(
    '/graphql',
    await rateLimiterMiddleware(),
    (req, res, next) => {
      const isAuthenticated = req.user !== undefined
      // Increase the body limit for authenticated users, because they can be trusted more to not DDOS the server
      const jsonHandler = json({ limit: isAuthenticated ? '10mb' : '1mb' })
      jsonHandler(req, res, next)
    },
    expressMiddleware(server, {
      context: async ({ req }) => createContext({ req, claims: req.user }),
    }),
  )
}
