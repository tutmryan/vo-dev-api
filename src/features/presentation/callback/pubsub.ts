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
import { pubsub, subscribeToCachedEvents } from '../../../redis/pubsub'
import type { PresentationRequestDetails } from '../commands/create-presentation-request-command'
import { PresentationEntity } from '../entities/presentation-entity'
import { getPresentationDataFromCache } from './cache'

const PRESENTATION_TOPIC = 'presentation'

export type PresentationTopicData = PresentationRequestDetails & {
  event: PresentationCallbackEvent
  presentationId?: string
}

export const publishPresentationEvent = async (data: PresentationTopicData): Promise<void> => {
  pubsub().publish(`${PRESENTATION_TOPIC}.${data.event.requestId}`, data)
}

const eventIsFinal = (data: PresentationTopicData) =>
  [PresentationRequestStatus.PresentationVerified, PresentationRequestStatus.PresentationError].includes(data.event.requestStatus)

export const subscribeToPresentationEvents = (args?: SubscriptionPresentationEventArgs) => {
  const requestIdArg = args?.where?.requestId
  return subscribeToCachedEvents<PresentationTopicData>({
    eventId: requestIdArg ?? undefined,
    topic: PRESENTATION_TOPIC,
    getFromCache: getPresentationDataFromCache,
    eventIsFinal,
  })
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
