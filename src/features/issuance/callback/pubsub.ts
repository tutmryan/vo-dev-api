import type { GraphQLContext } from '@makerx/graphql-core'
import { withFilter } from 'graphql-subscriptions'
import { pubsub } from '../../../cache'
import { entityManager } from '../../../data'
import type {
  IssuanceCallbackEvent,
  IssuanceEventData,
  SubscriptionIssuanceEventArgs,
  SubscriptionSubscribeFn,
} from '../../../generated/graphql'
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

export const subscribeToIssuanceEvents = (args?: SubscriptionIssuanceEventArgs) => {
  let count = 0
  const iterator = pubsub.asyncIterator<IssuanceTopicData>(ISSUANCE_TOPIC)
  return {
    next: async () => {
      if (!args?.where?.requestId) return iterator.next()
      const data = await getIssuanceDataFromCache(args.where.requestId)
      if (!data) return iterator.next()
      return Promise.resolve({ done: count++ === 1, value: data })
    },
    return: iterator.return,
    throw: iterator.throw,
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
