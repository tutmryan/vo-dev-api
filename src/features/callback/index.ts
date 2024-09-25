import { extractErrorResponseInfo } from '@makerx/node-common'
import type { RequestHandler } from 'express'
import { capitalize, pick } from 'lodash'
import { requestCallbackCache } from '../../cache'
import type { Callback, IssuanceCallbackEvent, PresentationCallbackEvent } from '../../generated/graphql'
import { logger } from '../../logger'
import { InternalRoles } from '../../roles'
import { issuanceCallbackHandler } from '../issuance/callback/issuance-callback-handler'
import { presentationCallbackHandler } from '../presentation/callback/presentation-callback-handler'

export type IssuanceCallbackHandler = (event: IssuanceCallbackEvent) => Promise<void>
export type PresentationCallbackHandler = (event: PresentationCallbackEvent) => Promise<void>

export const issuanceCallbackMiddleware: RequestHandler = requestCallbackMiddleware('issuance', issuanceCallbackHandler as CallbackHandler)
export const presentationCallbackMiddleware: RequestHandler = requestCallbackMiddleware(
  'presentation',
  presentationCallbackHandler as CallbackHandler,
)

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

    const event = req.body as IssuanceCallbackEvent | PresentationCallbackEvent
    const loggableEventData = pick(event, ['requestId', 'requestStatus', 'error'])

    // check the request body contains an event
    if (!event.requestId) {
      logger.error(`Invalid ${type} callback request`, { event: loggableEventData, type })
      res.status(400).end()
      return
    }
    logger.info(`${capitalize(type)} callback received`, { event: loggableEventData, type })

    // invoke our handler
    if (handler) {
      try {
        await handler(event)
        logger.info(`${capitalize(type)} callback handler invoked`, { event: loggableEventData, type })
      } catch (error) {
        logger.error(`${capitalize(type)} callback handler failed`, { event: loggableEventData, type, error })
      }
    }

    // find the consumer callback for this event
    const callback = await requestCallbackCache.get(event.requestId)
    if (!callback) {
      logger.warn(`Failed to locate a matching consumer ${type} callback`, { requestId: event.requestId })
      res.status(204).end()
      return
    }

    // prepare to invoke the consumer callback
    const callbackData = JSON.parse(callback) as Callback
    const { url, headers } = callbackData
    if (url.includes(req.hostname)) throw new Error(`Callback url ${url} must not be this host`)
    const request: RequestInit = {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { ['Content-Type']: 'application/json', ...headers } as HeadersInit,
    }

    // invoke the consumer callback, log the outcome, return the response
    fetch(url, request)
      .then((response) => {
        if (response.ok) {
          logger.info(`Consumer ${type} callback complete`, {
            url,
            event: loggableEventData,
            type,
            responseStatus: response.status,
          })
          res.status(204).end()
        } else {
          extractErrorResponseInfo(response).then((responseInfo) => {
            logger.error(`Consumer ${type} callback failed`, {
              url,
              event: loggableEventData,
              type,
              response: responseInfo,
            })
          })
          res.status(response.status).end()
        }
      })
      .catch((error) => {
        logger.error(`Consumer ${type} callback failed`, { url, error, event: loggableEventData, type })
        res.status(500).end()
      })
  }
}
