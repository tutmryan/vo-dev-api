import { isLocalDev } from '@makerx/node-common'
import { urlencoded } from 'body-parser'
import type { Express, RequestHandler } from 'express'
import { isEmpty, pick } from 'lodash'
import { strict as assert } from 'node:assert'
import path from 'node:path'
import { stringify } from 'node:querystring'
import { inspect } from 'node:util'
import type Provider from 'oidc-provider'
import type { Grant, InteractionResults, UnknownObject } from 'oidc-provider'
import { instance } from '../../config'
import { requestOrigin } from '../../express'
import type { PresentationRequestForAuthnInput, RequestConfiguration } from '../../generated/graphql'
import { logger } from '../../logger'
import { invariant } from '../../util/invariant'
import { presentationLoginStandardClaims } from './claims'
import { ExtraParams } from './extra-params'
import { createRequestInfo } from './log-events'
import { acquireLoginPresentationToken, completeLogin } from './session'

// taken from: https://github.com/panva/node-oidc-provider/blob/main/example/routes/express.js
// - types hacked in
// - login interaction start route modified to kick off presentation
// - login complete route modified to complete login based off presentation

const showDebug = isLocalDev || instance === 'dev'

function buildAuthnPresentationRequest(params: UnknownObject): PresentationRequestForAuthnInput {
  const vcTypeParam = params[ExtraParams.vc_type] as string | undefined
  const vcIssuerParam = params[ExtraParams.vc_issuer] as string | undefined
  return {
    requestedCredentials: [
      {
        type: vcTypeParam ?? 'VerifiableCredential',
        acceptedIssuers: vcIssuerParam ? [vcIssuerParam] : undefined,
        configuration: buildRequestConfiguration(params),
      },
    ],
  }
}

const faceCheckMinConfidenceThreshold = 50
const faceCheckMaxConfidenceThreshold = 70

function buildRequestConfiguration(params: UnknownObject): RequestConfiguration | undefined {
  const facecheckParam = params[ExtraParams.vc_facecheck] as string | undefined
  if (facecheckParam === 'true') return { validation: { faceCheck: {} } }
  const asNumber = Number(facecheckParam)
  if (Number.isNaN(asNumber)) return undefined
  if (asNumber >= faceCheckMinConfidenceThreshold && asNumber <= faceCheckMaxConfidenceThreshold)
    return { validation: { faceCheck: { matchConfidenceThreshold: asNumber } } }
  return undefined
}

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

const noCache: RequestHandler = (req, res, next) => {
  res.set('cache-control', 'no-store')
  next()
}

export function routes(app: Express, route: string, provider: Provider): void {
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')

  app.use((req, res, next) => {
    const orig = res.render
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view, locals) => {
      app.render(view, locals, (err, html) => {
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
    try {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res)

      const client = await provider.Client.find(params.client_id as string)
      invariant(client, 'client not found')

      switch (prompt.name) {
        case 'login': {
          const token = await acquireLoginPresentationToken({ interactionId: uid, clientId: client.clientId })
          const presentationRequest = buildAuthnPresentationRequest(params)
          return res.render('login', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Sign-in',
            graphqlUrl: `${requestOrigin(req)}/graphql`,
            presentationAccessToken: token.access_token,
            presentationRequest,
            showDebug,
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          })
        }
        case 'consent': {
          return res.render('interaction', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Authorize',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          })
        }
        default:
          return undefined
      }
    } catch (err) {
      return next(err)
    }
  })

  app.post(`${route}/interaction/:uid/login`, noCache, body, async (req, res, next) => {
    try {
      const {
        uid,
        prompt: { name },
        params,
      } = await provider.interactionDetails(req, res)
      invariant(params.client_id, 'Could not obtain client_id from interaction params')
      assert.equal(name, 'login')
      const loginResult = await completeLogin({ interactionId: uid, requestId: req.body.requestId, clientId: params.client_id as string })

      logger.audit('OIDC login complete', {
        interactionId: uid,
        requestId: req.body.requestId,
        clientId: params.client_id as string,
        ...pick(loginResult, 'accountId', 'presentationId'),
        request: createRequestInfo(req),
      })

      const result: InteractionResults = {
        login: {
          accountId: loginResult.accountId,
          amr: [presentationLoginStandardClaims.amr],
        },
      }

      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    } catch (err) {
      next(err)
    }
  })

  app.post(`${route}/interaction/:uid/confirm`, noCache, body, async (req, res, next) => {
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
}
