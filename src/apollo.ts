import type { ApolloServerPlugin } from '@apollo/server'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { expressMiddleware } from '@as-integrations/express5'
import { ApolloArmor } from '@escape.tech/graphql-armor'
import type { GraphQLArmorConfig } from '@escape.tech/graphql-armor-types'
import { verifyMultiIssuer } from '@makerx/express-bearer'
import { graphqlOperationLoggingPlugin, introspectionControlPlugin } from '@makerx/graphql-apollo-server'
import { useSubscriptionsServer } from '@makerx/graphql-core/subscriptions'
import { isLocalDev, isProduction } from '@makerx/node-common'
import type { Express } from 'express'
import { json } from 'express'
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4'
import type http from 'http'
import { authenticatedIntrospectionPlugin } from './apollo.authenticatedIntrospectionPlugin'
import { AuditEvents } from './audit-types'
import { graphQL, logging } from './config'
import type { GraphQLContext } from './context'
import { createContext, createSubscriptionContext } from './context'
import { getIssuerOptions } from './features/instance-configs'
import type { Logger } from './logger'
import { logger } from './logger'
import { rateLimiterMiddleware } from './rate-limiter'
import { UserRoles } from './roles'
import createSchema from './schema'

/**
 * Returns the appropriate audit event based on the GraphQL operation type.
 * Falls back to API_GRAPHQL_OPERATION if type is unknown.
 */
function getAuditEventForOperationType(operationType: GraphQLContext['operationType']) {
  switch (operationType) {
    case 'query':
      return AuditEvents.API_GRAPHQL_QUERY
    case 'mutation':
      return AuditEvents.API_GRAPHQL_MUTATION
    case 'subscription':
      return AuditEvents.API_GRAPHQL_SUBSCRIPTION
    default:
      return AuditEvents.API_GRAPHQL_OPERATION
  }
}

/**
 * Plugin that captures the GraphQL operation type and stores it in context.
 * Must run before the logging plugin so the type is available for audit logging.
 */
const operationTypePlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async didResolveOperation({ operation, contextValue }) {
        if (operation) {
          contextValue.operationType = operation.operation
        }
      },
    }
  },
}

export function createArmorProtection(config?: GraphQLArmorConfig) {
  const armor = new ApolloArmor(
    config ?? {
      costLimit: { enabled: false },
      maxAliases: {
        n: graphQL.maxAliases,
      },
      maxDepth: {
        n: graphQL.maxDepth,
      },
      maxTokens: {
        n: graphQL.maxTokens,
      },
      maxDirectives: {
        n: graphQL.maxDirectives,
      },
    },
  )
  const protection = armor.protect()
  return { armor, protection }
}

const plugins = (
  httpServer: http.Server,
  protection: { plugins: ApolloServerPlugin[] },
  serverCleanup?: () => Promise<void>,
): ApolloServerPlugin<GraphQLContext>[] => {
  const plugins: ApolloServerPlugin<GraphQLContext>[] = [
    authenticatedIntrospectionPlugin, // Require authentication for introspection queries
    // GraphQLArmor protection plugins
    ...protection.plugins,
    operationTypePlugin,
    graphqlOperationLoggingPlugin<GraphQLContext, Logger>({
      logLevel: 'info',
      contextCreationFailureLogger: logger,
      includeMutationResponseData: true,
      augmentLogEntry(ctx) {
        const auditEvent = getAuditEventForOperationType(ctx.operationType)
        return {
          eventTypeId: auditEvent.id,
          user: {
            id: ctx.user?.id,
            name: ctx.user?.name,
            roles: ctx.user?.roles,
          },
          request: ctx.requestInfo,
        }
      },
    }),
    introspectionControlPlugin as ApolloServerPlugin<GraphQLContext>,
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

  plugins.push(ApolloServerPluginLandingPageLocalDefault({ embed: true, includeCookies: true }))

  plugins.push(createApollo4QueryValidationPlugin())
  return plugins
}

export const startApolloServer = async (app: Express, httpServer: http.Server, ...serverCleanup: Array<() => Promise<any>>) => {
  logger.info('Building schema')
  const schema = createSchema()

  logger.info('Initialising subscriptions websocket server')
  const wsServerCleanup = useSubscriptionsServer({
    logger,
    operationLogLevel: 'info',
    schema,
    httpServer,
    createSubscriptionContext,
    jwtClaimsToLog: logging.userClaimsToLog,
    requireAuth: true,
    verifyToken: (host, token) => verifyMultiIssuer(host, token, { issuerOptions: getIssuerOptions() }),
    resolveSubscriptionOperationLogger: (context) => (context as GraphQLContext).logger as unknown as typeof logger,
  })

  logger.info('Starting apollo server')
  const { protection } = createArmorProtection()
  const server = new ApolloServer<GraphQLContext>({
    logger,
    schema,
    ...protection,
    plugins: plugins(httpServer, protection, async () => {
      await Promise.all([wsServerCleanup.dispose(), ...serverCleanup.map((cleanup) => cleanup())])
    }),
    introspection: true,
    includeStacktraceInErrorResponses: isLocalDev,
    csrfPrevention: true,
    hideSchemaDetailsFromClientErrors: false,
  })
  await server.start()

  app.use(
    '/graphql',
    await rateLimiterMiddleware(),
    (req, res, next) => {
      // Protect Apollo Studio landing page (browser requests) with role check
      const isBrowserRequest = req.headers.accept?.split(',').includes('text/html')
      if (isBrowserRequest) {
        const userRoles = req.user?.roles ?? []
        if (!userRoles.includes(UserRoles.toolsAPIExplorerAccess)) {
          res.status(403).send('Access denied. You need the tools.apiExplorer.access role to access Apollo Studio.').end()
          return
        }
      }

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
