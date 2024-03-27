import { extractErrorResponseInfo } from '@makerx/node-common'
import type { RequestHandler } from 'express'
import { capitalize } from 'lodash'
import { requestCallbackCache } from '../../cache'
import type { Callback, IssuanceCallbackEvent, PresentationCallbackEvent } from '../../generated/graphql'
import { logger } from '../../logger'
import { InternalRoles } from '../../roles'

export type IssuanceCallbackHandler = (event: IssuanceCallbackEvent) => Promise<void>
export type PresentationCallbackHandler = (event: PresentationCallbackEvent) => Promise<void>

export function issuanceCallbackMiddleware(handler?: IssuanceCallbackHandler): RequestHandler {
  return requestCallbackMiddleware('issuance', handler as CallbackHandler)
}
export function presentationCallbackMiddleware(handler?: PresentationCallbackHandler): RequestHandler {
  return requestCallbackMiddleware('presentation', handler as CallbackHandler)
}

type CallbackHandler = (event: IssuanceCallbackEvent | PresentationCallbackEvent) => Promise<void>

function requestCallbackMiddleware(type: 'issuance' | 'presentation', handler?: CallbackHandler): RequestHandler {
  return async (req, res) => {
    // auth callback
    if (!req.user) {
      logger.error(`Invalid ${type} callback request: Unauthorized`)
      res.status(401).send('Unauthorized').end()
      return
    }
    const isAuthorised = Array.isArray(req.user.roles) && req.user.roles.includes(InternalRoles.callback)
    if (!isAuthorised) {
      logger.error(`Invalid ${type} callback request: Forbidden`)
      res.status(403).send('Forbidden').end()
      return
    }

    // check the request body contains an event
    const event = req.body as IssuanceCallbackEvent | PresentationCallbackEvent
    if (!event.requestId) {
      logger.error(`Invalid ${type} callback request`, { event, type })
      res.status(400).end()
      return
    }
    logger.info(`${capitalize(type)} callback received`, { event, type })

    // invoke our handler
    if (handler) {
      try {
        await handler(event)
        logger.info(`${capitalize(type)} callback handler invoked`, { event, type })
      } catch (error) {
        logger.error(`${capitalize(type)} callback handler failed`, { event, type, error })
      }
    }

    // find the upstream callback for this event
    const callback = await requestCallbackCache.get(event.requestId)
    if (!callback) {
      logger.warn(`Failed to locate a matching upstream ${type} callback`, { requestId: event.requestId })
      res.status(204).end()
      return
    }

    // prepare to invoke the upstream callback
    const callbackData = JSON.parse(callback) as Callback
    const { url, headers } = callbackData
    if (url.includes(req.hostname)) throw new Error(`Callback url ${url} must not be this host`)
    const request: RequestInit = {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { ['Content-Type']: 'application/json', ...headers } as HeadersInit,
    }

    // invoke the upstream callback, log the outcome, return the response
    fetch(url, request)
      .then((response) => {
        if (response.ok) {
          logger.info(`Upstream ${type} callback complete`, {
            event,
            type,
            responseStatus: response.status,
          })
          res.status(204).end()
        } else {
          extractErrorResponseInfo(response).then((responseInfo) => {
            logger.error(`Upstream ${type} callback failed`, {
              event,
              type,
              response: responseInfo,
            })
          })
          res.status(response.status).end()
        }
      })
      .catch((error) => {
        logger.error(`Upstream ${type} callback failed`, { error, event, type })
        res.status(500).end()
      })
  }
}
