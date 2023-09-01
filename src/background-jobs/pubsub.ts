import type { GraphQLContext } from '@makerx/graphql-core'
import { withFilter } from 'graphql-subscriptions'
import { BACKGROUND_JOB_EVENTS_TTL, finishedBackgroundJobEvents, pubsub } from '../cache'
import { entityManager } from '../data'
import { UserEntity } from '../features/users/entities/user-entity'
import type {
  BackgroundJobEvent,
  BackgroundJobEventData,
  InputMaybe,
  SubscriptionBackgroundJobEventArgs,
  SubscriptionSubscribeFn,
} from '../generated/graphql'
import { BackgroundJobStatus } from '../generated/graphql'

const BACKGROUND_JOB_TOPIC = 'backgroundJob'

export type BackgroundJobTopicData = {
  jobId: string
  jobName: string
  event: BackgroundJobEvent
  userId?: string
}

export const publishBackgroundJobEvent = async (data: BackgroundJobTopicData): Promise<void> => {
  // keep a copy of the job finished event in cache so that
  // we can immediately return the event to any subscriber
  // subscribing after the event has happened
  if (data.event.status === BackgroundJobStatus.Completed || data.event.status === BackgroundJobStatus.Failed) {
    await finishedBackgroundJobEvents.set(data.jobId, JSON.stringify(data), { ttl: BACKGROUND_JOB_EVENTS_TTL })
  }
  return pubsub.publish(BACKGROUND_JOB_TOPIC, data)
}

const getJobFinishedEventFromCache = async (jobId?: InputMaybe<string>): Promise<BackgroundJobTopicData | null> => {
  if (!jobId) return null
  const cachedValue = await finishedBackgroundJobEvents.get(jobId)
  return cachedValue ? (JSON.parse(cachedValue) as BackgroundJobTopicData) : null
}

export const subscribeToBackgroundJobEvents = (args?: SubscriptionBackgroundJobEventArgs) => {
  let count = 0
  const pubsubIterator = pubsub.asyncIterator<BackgroundJobTopicData>(BACKGROUND_JOB_TOPIC)
  return {
    next: async () => {
      const cachedEvent = await getJobFinishedEventFromCache(args?.where?.jobId)
      return cachedEvent ? Promise.resolve({ done: count++ === 1, value: cachedEvent }) : pubsubIterator.next()
    },
    return: pubsubIterator.return,
    throw: pubsubIterator.throw,
  }
}

export const subscribeToBackgroundJobEventsWithFilter = withFilter(
  (_, args: SubscriptionBackgroundJobEventArgs) => subscribeToBackgroundJobEvents(args),
  (data: BackgroundJobTopicData, args: SubscriptionBackgroundJobEventArgs) => {
    const { jobId, jobName, status, userId } = args.where ?? {}

    if (jobId && data.jobId !== jobId) return false
    if (status && data.event.status !== status) return false
    if (userId && data.userId !== userId) return false
    if (jobName && data.jobName !== jobName) return false
    return true
  },
) as any as SubscriptionSubscribeFn<BackgroundJobEventData, any, GraphQLContext, SubscriptionBackgroundJobEventArgs>

export const resolveBackgroundJobEventData = ({ userId, ...rest }: BackgroundJobTopicData) => ({
  ...rest,
  user: userId ? entityManager.getRepository(UserEntity).findOneOrFail({ comment: 'FindUserById', where: { id: userId } }) : null,
})
