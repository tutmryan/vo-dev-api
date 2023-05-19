import { verifyForHost } from '@makerxstudio/express-bearer'
import type { ExecutionArgs, GraphQLSchema } from 'graphql'
import { print } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'
import type { IncomingMessage, Server } from 'http'
import type { JwtPayload } from 'jsonwebtoken'
import { isNil, omitBy, pick } from 'lodash'
import { WebSocketServer } from 'ws'
import config from './config'
import type { GraphQLContext } from './context'
import { createSubscriptionContext } from './context'
import { logger } from './logger'

const claimsToLog = config.get('logging.userClaimsToLog').length > 0 ? config.get('logging.userClaimsToLog') : ['oid', 'iss']

function logExecutionArgs(args: ExecutionArgs, message: string) {
  const { operationName, variableValues, document } = args
  const contextLogger = (args.contextValue as GraphQLContext).logger
  contextLogger.info(
    message,
    omitBy(
      {
        operationName,
        query: print(document),
        variables: variableValues,
      },
      isNil,
    ),
  )
}

export function extractTokenFromConnectionParams(connectionParams?: Readonly<Record<string, unknown>>) {
  const bearerTokenValue = (connectionParams?.authorization ?? connectionParams?.Authorization) as string | undefined
  if (!bearerTokenValue || !bearerTokenValue.startsWith('Bearer ')) {
    logger.error('No authorization paramater was supplied with websocket connection params')
    return undefined
  }
  return bearerTokenValue.substring(7)
}

export function getHost(request: IncomingMessage) {
  const proxyHostHeader = request.headers['x-forwarded-host']
  const host = Array.isArray(proxyHostHeader) ? proxyHostHeader[0] ?? undefined : proxyHostHeader ?? request.headers.host ?? undefined
  return host ?? 'subscriptions'
}

export function useSubscriptionsServer(schema: GraphQLSchema, httpServer: Server) {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })
  return useServer(
    {
      schema,
      onError(_ctx, message, errors) {
        logger.error('GraphQL subscriptions server error', { message, errors })
      },
      onConnect: async (ctx) => {
        // extract auth token from connection params
        const token = extractTokenFromConnectionParams(ctx.connectionParams)
        if (!token) return false
        // verify token, set claims on context.extra subsequent callbacks to use
        const claims = await verifyForHost(getHost(ctx.extra.request), token, config.get('auth.bearer'))
        ctx.extra.claims = claims as unknown as undefined
        // log and return true to establish connection
        logger.info('Subscription connection established', {
          claims: pick(claims, claimsToLog),
        })
        return true
      },
      onDisconnect({ extra: { claims } }) {
        logger.info('Subscription connection disconnected', { claims: pick(claims, claimsToLog) })
      },
      context: async (ctx) => {
        return createSubscriptionContext({
          connectRequest: ctx.extra.request,
          connectionParams: ctx.connectionParams,
          claims: ctx.extra.claims as JwtPayload | undefined,
        })
      },
      onOperation(_ctx, _message, args) {
        logExecutionArgs(args, 'GraphQL subscription operation')
      },
      onNext(_ctx, _message, args, _result) {
        logExecutionArgs(args, 'GraphQL subscription result')
      },
    },
    wsServer,
  )
}
