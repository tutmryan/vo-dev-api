import { RedisPubSub } from 'graphql-redis-subscriptions'
import { PubSub } from 'graphql-subscriptions'
import { createRedisClient, isRedisEnabled, redisOptions } from '.'
import { Lazy } from '../util/lazy'

const publisherClient = Lazy(() => (isRedisEnabled ? createRedisClient('publisher', { ...redisOptions, lazyConnect: true }) : undefined))
const subscriberClient = Lazy(() => (isRedisEnabled ? createRedisClient('subscriber', { ...redisOptions, lazyConnect: true }) : undefined))

/**
 * Initialises pubsub clients, ensuring they are connected before use.
 */
export async function initialisePubsub() {
  const publisher = publisherClient()
  if (publisher) await publisher.connect()
  const subscriber = subscriberClient()
  if (subscriber) await subscriber.connect()
}

export const pubsub = Lazy(() =>
  isRedisEnabled ? new RedisPubSub({ publisher: publisherClient(), subscriber: subscriberClient() }) : new PubSub(),
)

/**
 * Combines subscribing to a redis pubsub channel for event data with returning cached event data when subscribing to an event by ID.
 *
 * Notes:
 * - Supports optimised subscriptions for events by ID, using a topic with format `${topic}.${eventId}`.
 * - When no ID is supplied, the subscription will be for all events using pattern `${topic}.*`, the caller MUST filter data, e.g. via a resolver filter using `withFilter`.
 * - When an ID is supplied, only events for that ID will be returned, and the iteration will end when a final event is received.
 * @param eventId The ID of the event to subscribe to, or `undefined` to subscribe to all events.
 * @param topic The topic to subscribe to.
 * @param getFromCache A function to retrieve cached event data for the given ID.
 * @param eventIsFinal A function to determine if an event is final (and iteration should end).
 * @param onSubscribeValidate An optional function to validate against the cached data when subscribing. This can be used to prevent invalid subscriptions by throwing an error.
 * @returns An async iterator for the event data.
 */
export function subscribeToCachedEvents<TEventData>({
  eventId,
  topic,
  getFromCache,
  eventIsFinal,
  onSubscribeValidate,
}: {
  eventId?: string
  topic: string
  getFromCache: (eventId: string) => Promise<TEventData | undefined>
  eventIsFinal: (event: TEventData) => boolean
  onSubscribeValidate?: (data?: TEventData) => Promise<void>
}): AsyncIterator<TEventData> & AsyncIterable<TEventData> {
  // when subscribing without eventId, subscribe to all events using pattern matching (filter externally, e.g. via the resolver filter)
  if (!eventId) {
    const iterator = pubsub().asyncIterator<TEventData>(`${topic}.*`, { pattern: true })
    return { ...iterator, next: iterator.next.bind(iterator), [Symbol.asyncIterator]: () => iterator }
  }

  // otherwise:
  // - subscribe to events for the specific eventId
  // - check the finished event cache
  // - eagerly end iteration when the event is final
  const wrapped = pubsub().asyncIterator<TEventData>(`${topic}.${eventId}`)

  let count = 0
  let done = false

  const iterator: AsyncIterator<TEventData> = {
    next: async () => {
      // eagerly end iteration when done
      if (done) return { done: true, value: undefined }

      // on the first iteration, check for cached final event data
      if (count++ === 0) {
        const cached = await getFromCache(eventId)
        if (cached && eventIsFinal(cached)) {
          done = true
          return { value: cached }
        }
        // apply optional validation on subscribe
        await onSubscribeValidate?.(cached)
      }

      // inspect values to eagerly end iteration when the event is final
      const next = await wrapped.next.call(wrapped)
      if (!next.done && eventIsFinal(next.value)) done = true
      return next
    },
    return: wrapped.return!.bind(wrapped),
    throw: wrapped.throw!.bind(wrapped),
  }

  return { ...iterator, [Symbol.asyncIterator]: () => iterator }
}
