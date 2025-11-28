import { isLocalDev } from '@makerx/node-common'
import { urlencoded } from 'body-parser'
import compression from 'compression'
import type { Express, RequestHandler } from 'express'
import { isEmpty, pick } from 'lodash'
import { strict as assert } from 'node:assert'
import path from 'node:path'
import { stringify } from 'node:querystring'
import { inspect } from 'node:util'
import type { Grant, InteractionResults } from 'oidc-provider'
import { instance } from '../../config'
import { requestOrigin } from '../../express'
import { isIe11, isWebView3 } from '../../util/browser'
import { invariant } from '../../util/invariant'
import { redactValueObjectUnknown } from '../../util/redact-values'
import { faceCheckAmr, presentationLoginStandardClaims } from './claims'
import { filterToRequestedClaimsAcr, filterToRequestedClaimsAmr } from './claims-parameter'
import { eamLoginFailResult, getEamAcr, getEamAmr, isEamRequestAndLoginShouldFail } from './integrations/entra-eam'
import { buildRequestLogger } from './logger'
import { voLogoUrl } from './logos'
import { getClient, getData, getProvider, oidcProviderModule } from './provider'
import { acquireLoginPresentationToken, buildAuthnPresentationRequest, completeLogin, getLoginInteractionData } from './session'

// taken from: https://github.com/panva/node-oidc-provider/blob/main/example/routes/express.js
// - types hacked in
// - login interaction start route modified to kick off presentation
// - login complete route modified to complete login based off presentation

const showDebug = isLocalDev || instance === 'dev'

export function debug(obj: any) {
  if (!showDebug) return ''
  const keys = new Set()
  return stringify(
    Object.entries(obj).reduce<Record<string, any>>((acc, [key, value]) => {
      keys.add(key)
      if (isEmpty(value)) return acc
      acc[key] = inspect(value, { depth: null })
      return acc
    }, {}),
    '<br/>',
    ': ',
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value
      },
    },
  )
}

const body = urlencoded({ extended: false })

const noCache: RequestHandler = (_req, res, next) => {
  res.set('cache-control', 'no-store')
  next()
}

export function routes(app: Express, route: string): void {
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')

  app.use(compression())

  app.use((req, res, next) => {
    const logger = buildRequestLogger(req)
    const orig = res.render
    res.render = (view, locals) => {
      const userAgent = req.headers['user-agent'] ?? ''

      locals = {
        ...locals,
        dropToEs5: isIe11(userAgent),
        dropToEs6: isWebView3(userAgent),
        cspNonce: res.locals.cspNonce,
      }

      if (view === 'no-session') {
        // orig is overloaded, and the correct overload type is lost so we cast locals to any
        orig.call(res, view, locals as any)
        return
      }

      app.render(view, locals, (err, html) => {
        if (err as Error | undefined) {
          // An empty _layout fill will render. There's not much we can do to improve this.
          // The log here is to help us find the problems with templates that only happen due to differences in data supplied at runtime.
          logger.error(`OIDC render error while rendering template for: ${view}`, { error: err })
        }
        const options: any = {
          ...locals,
          body: html,
        }
        orig.call(res, '_layout', options)
      })
    }
    next()
  })

  // for testing static UI examples
  // app.get(`${route}/test`, noCache, async (req, res, next) => {
  //   return res.render('test', { title: 'Sign in', uid: '123', client: 'Demo client', session: {}, dbg: {} })
  // })

  app.get(`${route}/interaction/:uid`, noCache, async (req, res, next) => {
    const provider = getProvider()
    const logger = buildRequestLogger(req)

    try {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res)

      const client = await provider.Client.find(params.client_id as string)
      invariant(client, 'client not found')

      const loginInteractionData = await getLoginInteractionData(uid)

      switch (prompt.name) {
        case 'login': {
          const token = await acquireLoginPresentationToken({ interactionId: uid, clientId: client.clientId })
          const clientEntity = getClient(client.clientId)

          // Integration hooks
          if (isEamRequestAndLoginShouldFail(loginInteractionData, logger)) {
            await provider.interactionFinished(req, res, eamLoginFailResult, { mergeWithLastSubmission: false })
            return
          }

          // TODO: handle param validation errors with a better UX
          const presentationRequest = await buildAuthnPresentationRequest(
            params,
            clientEntity,
            getData().partners,
            loginInteractionData,
            logger,
          )
          logger.verbose('OIDC login presentation request', {
            presentationRequest: redactValueObjectUnknown(presentationRequest),
          })
          const { logo, backgroundColor, backgroundImage } = clientEntity

          return res.render('login', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Sign in to',
            graphqlUrl: `${requestOrigin(req)}/graphql`,
            presentationAccessToken: token.access_token,
            presentationRequest,
            voLogoUrl,
            logoUrl: logo,
            backgroundColor,
            backgroundImageUrl: backgroundImage,
            showDebug,
            showErrorDebug: false,
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          })
        }
        case 'consent': {
          const clientEntity = getClient(client.clientId)
          const { logo, backgroundColor, backgroundImage } = clientEntity
          return res.render('unsupported-operation', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Unsupported operation',
            voLogoUrl,
            logoUrl: logo,
            backgroundColor,
            backgroundImageUrl: backgroundImage,
            showDebug,
            showErrorDebug: false,
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          })
          // The VO solution currently auto-consents, and doesn't support the concept of an auth session
          // If the provider is wanting the user to consent, it's very likely to be a configuration issue,
          // such as a missing mapping of claims or incorrect scope(s) requested.

          // return res.render('interaction', {
          //   client,
          //   uid,
          //   details: prompt.details,
          //   params,
          //   title: 'Authorize',
          //   voLogoUrl,
          //   logoUrl: logo,
          //   backgroundColor,
          //   backgroundImageUrl: backgroundImage,
          //   showDebug,
          //   showErrorDebug: false,
          //   session: session ? debug(session) : undefined,
          //   dbg: {
          //     params: debug(params),
          //     prompt: debug(prompt),
          //   },
          // })
        }
        default:
          return undefined
      }
    } catch (err) {
      return next(err)
    }
  })

  app.post(`${route}/interaction/:uid/login`, noCache, body, async (req, res, next) => {
    const provider = getProvider()
    const logger = buildRequestLogger(req)

    try {
      const {
        uid,
        prompt: { name },
        params,
      } = await provider.interactionDetails(req, res)
      invariant(params.client_id, 'Could not obtain client_id from interaction params')
      const clientId = params.client_id as string
      assert.equal(name, 'login')

      const loginInteractionData = await getLoginInteractionData(uid)
      invariant(loginInteractionData, 'login interaction data not found')

      const client = getClient(clientId)

      const loginResult = await completeLogin(
        {
          interactionId: uid,
          requestId: req.body.requestId,
          clientId,
          uniqueClaimForSubParam: params.vc_unique_claim_for_sub as string | undefined,
        },
        client.uniqueClaimsForSubjectId ?? [],
        await client.claimMappings,
        logger,
      )

      logger.audit('OIDC login complete', {
        interactionId: uid,
        requestId: req.body.requestId,
        clientId: params.client_id as string,
        ...pick(loginResult, 'accountId', 'presentationId'),
      })

      let amr: string[] = [...presentationLoginStandardClaims.amr]
      if (loginResult.faceCheckMatchConfidenceScore) amr.push(faceCheckAmr)

      if (loginInteractionData.requestedClaims) {
        amr = filterToRequestedClaimsAmr(amr, loginInteractionData.requestedClaims)
      }

      // EAM Integration hooks
      if (loginInteractionData.integrations?.entraEam) amr = getEamAmr(loginInteractionData, logger)

      let acr = presentationLoginStandardClaims.acr as string

      if (loginInteractionData.requestedClaims) {
        acr = filterToRequestedClaimsAcr(acr, loginInteractionData.requestedClaims)
      }

      // EAM Integration hooks
      if (loginInteractionData.integrations?.entraEam) {
        acr = getEamAcr(loginInteractionData, logger)
      }

      const result: InteractionResults = {
        login: {
          accountId: loginResult.accountId,
          amr,
          acr,
        },
      }

      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    } catch (err) {
      next(err)
    }
  })

  app.post(`${route}/interaction/:uid/confirm`, noCache, body, async (req, res, next) => {
    const provider = getProvider()

    try {
      const interactionDetails = await provider.interactionDetails(req, res)
      invariant(interactionDetails.session, 'interaction session could not be found')
      const {
        prompt: { name, details },
        params,
        session: { accountId },
      } = interactionDetails
      assert.equal(name, 'consent')

      let { grantId } = interactionDetails
      let grant: Grant | undefined

      if (grantId) {
        // we'll be modifying existing grant in existing session
        grant = await provider.Grant.find(grantId)
      } else {
        // we're establishing a new grant
        grant = new provider.Grant({
          accountId,
          clientId: params.client_id as string,
        })
      }

      invariant(grant, 'grant could not be found in session')

      if (details.missingOIDCScope) {
        grant.addOIDCScope((details.missingOIDCScope as string[]).join(' '))
      }
      if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims as string[])
      }
      if (details.missingResourceScopes) {
        for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
          grant.addResourceScope(indicator, scopes.join(' '))
        }
      }

      grantId = await grant.save()

      const consent: { grantId?: string } = {}
      if (!interactionDetails.grantId) {
        // we don't have to pass grantId to consent, we're just modifying existing one
        consent.grantId = grantId
      }

      const result = { consent }
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true })
    } catch (err) {
      next(err)
    }
  })

  app.get(`${route}/interaction/:uid/abort`, noCache, async (req, res, next) => {
    const provider = getProvider()

    try {
      const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction',
      }
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    } catch (err) {
      next(err)
    }
  })

  // TODO: consider custom route + view
  // app.use((err, req, res, next) => {
  //   if (err instanceof SessionNotFound) {
  //     // handle interaction expired / session not found error
  //   }
  //   next(err)
  // })

  // Error-handling middleware to intercept errors passed to next(err)
  // so that a nice error page can be rendered
  app.use(route, async (err: any, req: any, res: any, next: any) => {
    const logger = buildRequestLogger(req)
    logger.error('OIDC provider route error', { error: err })

    try {
      const { errors } = await oidcProviderModule()
      const provider = getProvider()
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res)

      const client = await provider.Client.find(params.client_id as string)
      invariant(client, 'client not found')

      const clientEntity = getClient(client.clientId)
      const { logo, backgroundColor, backgroundImage } = clientEntity

      if (err instanceof errors.OIDCProviderError) {
        // OIDCProviderError is a class of errors that all the common errors the OIDC provider can throw inherit from.
        // These errors include setting the status code for the response, hence we can use the status code from the error.
        res.status(err.statusCode)
      } else {
        // Safe to assume this is a server error
        res.status(500)
      }

      return res.render('error', {
        client,
        uid,
        details: prompt.details,
        params,
        title: 'Unrecoverable error',
        voLogoUrl,
        logoUrl: logo,
        backgroundColor,
        backgroundImageUrl: backgroundImage,
        showDebug,
        showErrorDebug: showDebug,
        session: session ? debug(session) : undefined,
        dbg: {
          params: debug(params),
          prompt: debug(prompt),
        },
        error: showDebug ? err : undefined,
      })
    } catch (error) {
      const { errors } = await oidcProviderModule()
      if (error instanceof errors.SessionNotFound) {
        return res.render('no-session', {
          voLogoUrl,
        })
      }

      // If we can't render the error page, just send a generic error response
      logger.error('OIDC provider route error while rendering error page', { error })
      res.status(500)
      // Call the next error handler to fall back to the default OIDC provider error handler
      next(error)
    }
  })

  // This route is used in local development only to serve the VO SDK JS file from the local filesystem
  // Steps to use this:
  // 1. Uncomment the code below
  // 2. Ensure you have the VO SDK repo checked out locally to the same parent directory as this repo
  // 3. Run `npm run build` in the VO SDK repo to build the SDK (and each time you make changes)
  // 4. Update the login.ejs file to load the SDK from this route instead of the CDN
  // if (isLocalDev) {
  //   app.get(`${route}/vosdk.js`, noCache, async (req, res, next) => {
  //     console.log('✨ Serving vosdk.js from local file for development')
  //     // get from local file system using a relative path
  //     const filePath = path.join(__dirname, '../../../../verified-orchestration-client-js/dist/index.es6.js')
  //     // load js file and return in response
  //     fs.readFile(filePath, 'utf8', (err, data) => {
  //       if (err) {
  //         next(err)
  //         return
  //       }
  //       // no-cache headers
  //       res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  //       res.setHeader('Pragma', 'no-cache')
  //       res.setHeader('Expires', '0')
  //       res.setHeader('Content-Type', 'application/javascript')
  //       res.send(data)
  //     })
  //   })
  // }
}
