import { isLocalDev } from '@makerx/node-common'
import { urlencoded } from 'body-parser'
import type { Express, RequestHandler } from 'express'
import { isEmpty, pick } from 'lodash'
import { strict as assert } from 'node:assert'
import path from 'node:path'
import { stringify } from 'node:querystring'
import { inspect } from 'node:util'
import type { Grant, InteractionResults } from 'oidc-provider'
import { dataRef } from '.'
import { instance } from '../../config'
import { requestOrigin } from '../../express'
import { logger } from '../../logger'
import { invariant } from '../../util/invariant'
import { faceCheckAmr, presentationLoginStandardClaims } from './claims'
import { createRequestInfo } from './log-events'
import { voLogoUrl } from './logos'
import { acquireLoginPresentationToken, buildAuthnPresentationRequest, completeLogin } from './session'

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

const noCache: RequestHandler = (req, res, next) => {
  res.set('cache-control', 'no-store')
  next()
}

function getProvider() {
  const provider = dataRef.provider
  invariant(provider, 'dataRef.provider not set')
  return provider
}

function getData() {
  const data = dataRef.data
  invariant(data, 'dataRef.data not set')
  return data
}

function getClient(clientId: string) {
  const client = getData().clients.find((c) => c.id.toLowerCase() === clientId)
  invariant(client, 'client not found')
  return client
}

export function routes(app: Express, route: string): void {
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
    const provider = getProvider()

    try {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res)

      const client = await provider.Client.find(params.client_id as string)
      invariant(client, 'client not found')

      switch (prompt.name) {
        case 'login': {
          const token = await acquireLoginPresentationToken({ interactionId: uid, clientId: client.clientId })
          const clientEntity = getClient(client.clientId)
          // TODO: handle param validation errors with a better UX
          const presentationRequest = await buildAuthnPresentationRequest(params, clientEntity, getData().partners)
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
          return res.render('interaction', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Authorize',
            voLogoUrl,
            logoUrl: logo,
            backgroundColor,
            backgroundImageUrl: backgroundImage,
            showDebug,
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
    const provider = getProvider()

    try {
      const {
        uid,
        prompt: { name },
        params,
      } = await provider.interactionDetails(req, res)
      invariant(params.client_id, 'Could not obtain client_id from interaction params')
      const clientId = params.client_id as string
      assert.equal(name, 'login')
      const loginResult = await completeLogin(
        {
          interactionId: uid,
          requestId: req.body.requestId,
          clientId,
          uniqueClaimForSubParam: params.vc_unique_claim_for_sub as string | undefined,
        },
        getClient(clientId).uniqueClaimsForSubjectId ?? [],
      )

      logger.audit('OIDC login complete', {
        interactionId: uid,
        requestId: req.body.requestId,
        clientId: params.client_id as string,
        ...pick(loginResult, 'accountId', 'presentationId'),
        request: createRequestInfo(req),
      })

      const amr: string[] = [...presentationLoginStandardClaims.amr]
      if (loginResult.faceCheckMatchConfidenceScore) amr.push(faceCheckAmr)

      const result: InteractionResults = {
        login: {
          accountId: loginResult.accountId,
          amr,
          acr: presentationLoginStandardClaims.acr,
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
}
