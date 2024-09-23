import type { GraphQLContext } from '@makerx/graphql-core'
import { withFilter } from 'graphql-subscriptions'
import { entityManager } from '../../../data'
import {
  IssuanceRequestStatus,
  type IssuanceCallbackEvent,
  type IssuanceEventData,
  type SubscriptionIssuanceEventArgs,
  type SubscriptionSubscribeFn,
} from '../../../generated/graphql'
import { pubsub } from '../../../redis'
import type { IssuanceRequestDetails } from '../commands/create-issuance-request-command'
import { IssuanceEntity } from '../entities/issuance-entity'
import { getIssuanceDataFromCache } from './cache'

const ISSUANCE_TOPIC = 'issuance'

export type IssuanceTopicData = IssuanceRequestDetails & {
  event: IssuanceCallbackEvent
  issuanceId?: string
}

export const publishIssuanceEvent = async (data: IssuanceTopicData): Promise<void> => {
  pubsub.publish(ISSUANCE_TOPIC, data)
}

const eventIsFinal = (data: IssuanceTopicData) =>
  [IssuanceRequestStatus.IssuanceSuccessful, IssuanceRequestStatus.IssuanceError].includes(data.event.requestStatus)

export const subscribeToIssuanceEvents = (args?: SubscriptionIssuanceEventArgs) => {
  const iterator = pubsub.asyncIterator<IssuanceTopicData>(ISSUANCE_TOPIC)

  let count = 0
  let done = false

  return {
    next: async () => {
      // eagerly end iteration
      if (done) return { done: true, value: undefined }

      // when subscribing by requestId
      if (count++ === 0 && args?.where?.requestId) {
        // check for cached final event data
        const cachedData = await getIssuanceDataFromCache(args.where.requestId)
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

export const subscribeToIssuanceEventsWithFilter = withFilter(
  (_, args: SubscriptionIssuanceEventArgs) => subscribeToIssuanceEvents(args),
  (data: IssuanceTopicData, args: SubscriptionIssuanceEventArgs) => {
    const { issuedById, identityId, contractId, requestId, status } = args.where ?? {}

    if (issuedById && data.issuedById !== issuedById) return false
    if (identityId && data.identityId !== identityId) return false
    if (contractId && data.contractId !== contractId) return false
    if (requestId && data.event.requestId !== requestId) return false
    if (status && data.event.requestStatus !== status) return false

    return true
  },
) as any as SubscriptionSubscribeFn<IssuanceEventData, any, GraphQLContext, SubscriptionIssuanceEventArgs>

export const resolveIssuanceEventData = ({ event, issuanceId }: IssuanceTopicData) => ({
  event,
  issuance: issuanceId
    ? entityManager.getRepository(IssuanceEntity).findOneOrFail({ comment: 'FindIssuanceById', where: { id: issuanceId } })
    : null,
})
