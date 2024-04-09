import type { Configuration } from '@azure/msal-node'
import { ConfidentialClientApplication } from '@azure/msal-node'
import { bearerTokenMiddleware } from '@makerx/express-bearer'
import type { AuthConfig } from '@makerx/express-msal'
import {
  copySessionJwtToBearerHeader,
  isAuthenticatedSession,
  logout,
  pkceAuthenticationMiddleware,
  toNpmLogLevel,
} from '@makerx/express-msal'
import { isLocalDev } from '@makerx/node-common'
import bodyParser from 'body-parser'
import cookieSession from 'cookie-session'
import cors from 'cors'
import type { Express } from 'express'
import express from 'express'
import helmet from 'helmet'
import { clone, merge } from 'lodash'
import {
  bearer,
  cookieSession as cookieSessionConfig,
  cors as corsConfig,
  devToolsEnabled,
  issuanceCallbackRoute,
  pkce,
  presentationCallbackRoute,
} from './config'
import { issuanceCallbackMiddleware, presentationCallbackMiddleware } from './features/callback'
import { issuanceCallbackHandler } from './features/issuance/callback/issuance-callback-handler'
import { presentationCallbackHandler } from './features/presentation/callback/presentation-callback-handler'
import { logger } from './logger'
import rateLimiterMiddleware from './rate-limiter'
import { addVoyager } from './voyager'

export const getExpressApp = (): Express => {
  const app = express()
  app.set('trust proxy', true)

  app.use(
    helmet({
      strictTransportSecurity: !isLocalDev,
      contentSecurityPolicy: devToolsEnabled
        ? {
            // override helmet defaults with apollo sandbox + voyager config
            directives: {
              imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
              scriptSrc: [`'self'`, `https: 'unsafe-inline'`, `https: 'unsafe-eval'`], // voyager needs unsafe-eval
              manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
              frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
              workerSrc: [`'self'`, 'blob:'], // voyager needs blob:
            },
          }
        : undefined, // undefined means use default helmet CSP
    }),
  )

  app.use(cors(corsConfig))
  logger.info(`Using CORS origin: ${corsConfig.origin}`)

  if (devToolsEnabled) {
    app.use(cookieSession(clone(cookieSessionConfig)))

    app.get('/user', (req, res) => {
      if (!isAuthenticatedSession(req.session)) return res.status(400).send('Not logged in ¯\\_(ツ)_/¯').end()
      return res.send(req.session.username).end()
    })
    logger.info('Added GET /user')

    if (pkce.logoutUrl) {
      app.get('/logout', (req, res) =>
        res.redirect(`${pkce.logoutUrl}?post_logout_redirect_uri=${req.protocol}://${req.get('Host')}/logged-out`),
      )
      app.get('/logged-out', logout)
      logger.info('Added GET /logout and /logged-out')
    }

    const msalLoggerConfig: Partial<Configuration> = {
      system: {
        loggerOptions: {
          loggerCallback: (level, message) => logger.log(toNpmLogLevel(level), message),
        },
      },
    }
    const msalConfig = merge(msalLoggerConfig, pkce.msalConfig)
    const msalClient = new ConfidentialClientApplication(msalConfig)
    const authConfig: AuthConfig = {
      app,
      msalClient,
      scopes: pkce.scopes,
      logger,
      augmentSession: (response) => {
        return { username: response.account?.username }
      },
    }

    // set a bearer header
    app.use(copySessionJwtToBearerHeader)

    // set up default redirect
    app.get('/', (req, res) => res.redirect('/graphql'))
    logger.info(`Added default GET / redirect to /graphql`)

    // apply interactive auth to GET requests with `accept: text/html` unless there is an `authorization` header
    const interactiveAuthMiddleware = pkceAuthenticationMiddleware(authConfig)
    app.get('*', (req, res, next) =>
      !req.headers.authorization && req.headers.accept?.split(',').includes('text/html')
        ? interactiveAuthMiddleware(req, res, next)
        : next(),
    )

    // add voyager
    addVoyager(app)
    logger.info(`Added /voyager`)
  }

  // add bearer auth to all requests
  app.use(
    bearerTokenMiddleware({
      config: bearer,
      tokenIsRequired: false, // introspection requests are anonymous outside prod, so allow requests without tokens to pass through
      logger,
    }),
  )

  app.use(rateLimiterMiddleware)

  // add issuance and presentation callback routes
  const jsonParser = bodyParser.json({ limit: '1mb' })

  app.post(issuanceCallbackRoute, jsonParser, issuanceCallbackMiddleware(issuanceCallbackHandler))
  logger.info(`Added POST ${issuanceCallbackRoute}`)

  app.post(presentationCallbackRoute, jsonParser, presentationCallbackMiddleware(presentationCallbackHandler))
  logger.info(`Added POST ${presentationCallbackRoute}`)

  return app
}
