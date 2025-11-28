import type { Configuration } from '@azure/msal-node'
import { ConfidentialClientApplication } from '@azure/msal-node'
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
import { randomBytes } from 'crypto'
import type { Express, Request } from 'express'
import express from 'express'
import type { HelmetOptions } from 'helmet'
import helmet from 'helmet'
import type { ServerResponse } from 'http'
import { clone, merge } from 'lodash'
import { combinedBearerTokenMiddleware } from './authentication'
import {
  cookieSession as cookieSessionConfig,
  demoEnabled,
  devToolsEnabled,
  issuanceCallbackRoute,
  oidcEnabled,
  pkce,
  presentationCallbackRoute,
} from './config'
import { addAsyncIssuanceEmailStatusEndpoint } from './features/async-issuance/email-status-callback'
import { addAsyncIssuanceSmsStatusEndpoint as addAsyncIssuanceSmsStatusCallbackEndpoint } from './features/async-issuance/sms-status-callback'
import { issuanceCallbackMiddleware, presentationCallbackMiddleware } from './features/callback'
import { demoPresentationTokenHandlers, demoPresentationTokenRoute } from './features/demo'
import { corsConfig } from './features/instance-configs'
import { vcLogoProxyHandler, vcLogoProxyTokenRoute } from './features/local-dev/vc-logo-proxy'
import { addOidcProvider } from './features/oidc-provider'
import { logger } from './logger'
import { addServiceHealthEndpoints } from './services/monitoring/express'
import { isWebView3 } from './util/browser'
import { addVoyager } from './voyager'

export const requestOrigin = (req: Request): string => `${req.protocol}://${req.get('Host')}`

const getExpressCsp = (res: ServerResponse) => {
  // A cast is required here because Helmet is using Node's Response and Express extends it
  return (res as unknown as Express.Response).locals.cspNonce
}

const oidcOnlyCsp = {
  directives: {
    // https://cdn.jsdelivr.net is required for Windows embedded browser (The Chromium 70 used in the older WebView2)
    scriptSrc: [
      `'self'`,
      `'strict-dynamic'`,
      (req, _res) => (isWebView3(req.headers['user-agent'] ?? '') ? 'https://cdn.jsdelivr.net' : ''),
      (_req, res) => `'nonce-${getExpressCsp(res)}'`,
    ],
    formAction: null, // oidc form actions are dynamic - can't seem to wildcard this to a path blob expression
    styleSrc: [`'self'`, (_req, res) => `'nonce-${getExpressCsp(res)}'`],
    requireTrustedTypesFor: ["'script'"],
  },
} satisfies HelmetOptions['contentSecurityPolicy']

export async function getExpressApp(): Promise<Express> {
  const app = express()
  app.set('trust proxy', true)

  app.use((_req, res, next) => {
    // Must be a string of at least 128 bits (16 * 8 bit) of data from a cryptographically secure random number generator.
    // Using 24 gives us 192 bits, so a bit of extra security margin.
    // (Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
    res.locals.cspNonce = randomBytes(24).toString('hex')
    next()
  })

  app.use(
    helmet({
      strictTransportSecurity: !isLocalDev,
      contentSecurityPolicy: devToolsEnabled
        ? {
            // override helmet defaults with apollo sandbox + voyager config
            directives: {
              imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
              scriptSrc: [...oidcOnlyCsp.directives.scriptSrc],
              styleSrc: [...oidcOnlyCsp.directives.styleSrc],
              manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
              frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
              workerSrc: [`'self'`, 'blob:'], // voyager needs blob:
              connectSrc: [`'self'`, 'data:', 'https://cdn.jsdelivr.net'], // voyager needs self, data:, and cdn.jsdelivr.net
              formAction: oidcOnlyCsp.directives.formAction,
              requireTrustedTypesFor: oidcOnlyCsp.directives.requireTrustedTypesFor,
            },
          }
        : oidcEnabled
          ? oidcOnlyCsp
          : undefined, // undefined means use default helmet CSP
    }),
  )

  app.use(cors(corsConfig))
  logger.info(`Using CORS origin: ${corsConfig.origin}`)

  if (isLocalDev) {
    app.get(vcLogoProxyTokenRoute, vcLogoProxyHandler)
    logger.info(`Added ${vcLogoProxyTokenRoute}`)
  }

  app.get('/health', (req, res) => res.send('OK').end())
  logger.info('Added GET /health')

  addServiceHealthEndpoints(app)
  addAsyncIssuanceSmsStatusCallbackEndpoint(app)
  addAsyncIssuanceEmailStatusEndpoint(app)

  // Azure start-up probe (Don't use the known default and make the custom one unlikely to be discovered)
  app.get('/azure-startup-probe-40nt0001ihrkbxdry635', (_req, res) => {
    logger.info('Azure start-up probe hit')
    res.status(200).send('OK').end()
  })

  const notOidcRoute = /^\/(?!oidc).*$/

  if (devToolsEnabled) {
    app.use(notOidcRoute, cookieSession(clone(cookieSessionConfig)))

    app.get('/user', (req, res) => {
      if (!isAuthenticatedSession(req.session)) return res.status(400).send('Not logged in ¯\\_(ツ)_/¯').end()
      return res.send(req.session.username).end()
    })
    logger.info('Added GET /user')

    if (pkce.logoutUrl) {
      app.get('/logout', (req, res) => res.redirect(`${pkce.logoutUrl}?post_logout_redirect_uri=${requestOrigin(req)}/logged-out`))
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
    app.use(notOidcRoute, copySessionJwtToBearerHeader)

    // set up default redirect
    app.get('/', (req, res) => res.redirect('/graphql'))
    logger.info(`Added default GET / redirect to /graphql`)

    // apply interactive auth to GET requests with `accept: text/html` unless there is an `authorization` header
    const interactiveAuthMiddleware = pkceAuthenticationMiddleware(authConfig)
    app.get(notOidcRoute, (req, res, next) =>
      !req.headers.authorization && req.headers.accept?.split(',').includes('text/html')
        ? interactiveAuthMiddleware(req, res, next)
        : next(),
    )

    // add voyager
    addVoyager(app)
    logger.info(`Added /voyager`)
  }

  if (demoEnabled) {
    app.get(demoPresentationTokenRoute, ...demoPresentationTokenHandlers)
    logger.info(`Added ${demoPresentationTokenRoute}`)
  }

  // add bearer auth to all requests
  app.use(notOidcRoute, combinedBearerTokenMiddleware())

  // add issuance and presentation callback routes
  const jsonParser = bodyParser.json({ limit: '1mb' })

  app.post(issuanceCallbackRoute, jsonParser, issuanceCallbackMiddleware)
  logger.info(`Added POST ${issuanceCallbackRoute}`)

  app.post(presentationCallbackRoute, jsonParser, presentationCallbackMiddleware)
  logger.info(`Added POST ${presentationCallbackRoute}`)

  if (oidcEnabled) {
    // add OIDC provider, but don't wait for it to be ready
    addOidcProvider(app)
      .then((oidcRoute) => logger.info(`OIDC provider ready on ${oidcRoute}`))
      .catch((error) => logger.error('Failed to start OIDC provider', { error }))
  }

  return app
}
