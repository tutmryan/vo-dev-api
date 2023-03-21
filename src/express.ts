import type { Configuration } from '@azure/msal-node'
import { ConfidentialClientApplication } from '@azure/msal-node'
import { bearerTokenMiddleware } from '@makerxstudio/express-bearer'
import type { AuthConfig } from '@makerxstudio/express-msal'
import {
  copySessionJwtToBearerHeader,
  isAuthenticatedSession,
  logout,
  pkceAuthenticationMiddleware,
  toNpmLogLevel,
} from '@makerxstudio/express-msal'
import cookieSession from 'cookie-session'
import cors from 'cors'
import type { Express } from 'express'
import express from 'express'
import { clone, merge } from 'lodash'
import config from './config'
import { logger } from './logger'

export const getExpressApp = (): Express => {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)

  if (config.has('cors')) {
    app.use(cors(config.get('cors')))
  }

  if (config.get('auth.pkce.enabled') === true) {
    app.use(cookieSession(clone(config.get('cookieSession'))))

    app.get('/user', (req, res) => {
      if (!isAuthenticatedSession(req.session)) return res.status(400).send('Not logged in ¯\\_(ツ)_/¯').end()
      return res.send(req.session.username).end()
    })
    logger.info('Added GET /user')

    if (config.has('auth.pkce.logoutUrl')) {
      app.get('/logout', (req, res) =>
        res.redirect(`${config.get('auth.pkce.logoutUrl')}?post_logout_redirect_uri=${req.protocol}://${req.get('Host')}/logged-out`),
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
    const msalConfig = merge(msalLoggerConfig, config.get('auth.pkce.msalConfig'))
    const msalClient = new ConfidentialClientApplication(msalConfig)
    const authConfig: AuthConfig = {
      app,
      msalClient,
      scopes: config.get('auth.pkce.scopes'),
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
  }

  // add bearer auth to all requests
  app.use(
    bearerTokenMiddleware({
      config: config.get('auth.bearer'),
      tokenIsRequired: false, // introspection requests are anonymous outside prod, so allow requests without tokens to pass through
      logger,
    }),
  )

  // disable CSRF protection on the healthcheck query for GETs
  // so that the container healthcheck can run
  app.get('/graphql', async (req, res, next) => {
    if (req.url === '/graphql?query=%7Bhealthcheck%7D') {
      req.headers['apollo-require-preflight'] = 'true'
    }
    next()
  })

  return app
}
