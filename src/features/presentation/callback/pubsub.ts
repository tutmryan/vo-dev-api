import { withFilter } from 'graphql-subscriptions'
import { isNil } from 'lodash'
import type { GraphQLContext } from '../../../context'
import { entityManager } from '../../../data'
import type {
  PresentationCallbackEvent,
  PresentationEventData,
  SubscriptionPresentationEventArgs,
  SubscriptionSubscribeFn,
} from '../../../generated/graphql'
import { PresentationRequestStatus } from '../../../generated/graphql'
import { pubsub } from '../../../redis'
import type { PresentationRequestDetails } from '../commands/create-presentation-request-command'
import { PresentationEntity } from '../entities/presentation-entity'
import { getPresentationDataFromCache } from './cache'

const PRESENTATION_TOPIC = 'presentation'

export type PresentationTopicData = PresentationRequestDetails & {
  event: PresentationCallbackEvent
  presentationId?: string
}

export const publishPresentationEvent = async (data: PresentationTopicData): Promise<void> => {
  pubsub.publish(PRESENTATION_TOPIC, data)
}

const eventIsFinal = (data: PresentationTopicData) =>
  [PresentationRequestStatus.PresentationVerified, PresentationRequestStatus.PresentationError].includes(data.event.requestStatus)

export const subscribeToPresentationEvents = (args?: SubscriptionPresentationEventArgs) => {
  const iterator = pubsub.asyncIterator<PresentationTopicData>(PRESENTATION_TOPIC)

  let count = 0
  let done = false

  return {
    next: async () => {
      // eagerly end iteration
      if (done) return { done: true, value: undefined }

      // when subscribing by requestId
      if (count++ === 0 && args?.where?.requestId) {
        // check for cached final event data
        const cachedData = await getPresentationDataFromCache(args.where.requestId)
        if (cachedData && eventIsFinal(cachedData)) {
          done = true
          return { value: cachedData }
        }
      }

      // inspect values to eagerly end iteration for requestId subscribers when the event is final
      const next = await iterator.next.call(iterator)
      if (!next.done && args?.where?.requestId && eventIsFinal(next.value)) done = true
      return next
    },
    return: iterator.return!.bind(iterator),
    throw: iterator.throw!.bind(iterator),
  }
}

export const subscribeToPresentationEventsWithFilter = withFilter(
  (_, args: SubscriptionPresentationEventArgs) => subscribeToPresentationEvents(args),
  (data: PresentationTopicData, args: SubscriptionPresentationEventArgs) => {
    const { requestedById, identityId, requestId, type, status } = args.where ?? {}

    if (requestedById && data.requestedById !== requestedById) return false
    if (identityId && data.identityId !== identityId) return false
    if (requestId && data.event.requestId !== requestId) return false
    if (type && (isNil(data.event.verifiedCredentialsData) || !data.event.verifiedCredentialsData.some((data) => data.type.includes(type))))
      return false
    if (status && data.event.requestStatus !== status) return false

    return true
  },
) as any as SubscriptionSubscribeFn<PresentationEventData, any, GraphQLContext, SubscriptionPresentationEventArgs>

export const resolvePresentationEventData = ({ event, presentationId }: PresentationTopicData) => {
  return {
    event,
    presentation: presentationId
      ? entityManager.getRepository(PresentationEntity).findOneOrFail({ comment: 'FindPresentationById', where: { id: presentationId } })
      : null,
  }
}
