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

const eventIsFinal = (data: BackgroundJobTopicData) =>
  [BackgroundJobStatus.Completed, BackgroundJobStatus.Failed].includes(data.event.status)

export const subscribeToBackgroundJobEvents = (args?: SubscriptionBackgroundJobEventArgs) => {
  const iterator = pubsub.asyncIterator<BackgroundJobTopicData>(BACKGROUND_JOB_TOPIC)

  let count = 0
  let done = false

  return {
    next: async () => {
      // eagerly end iteration
      if (done) return { done: true, value: undefined }

      // when subscribing by jobId
      if (count++ === 0 && args?.where?.jobId) {
        // check for cached final event data
        const cachedData = await getJobFinishedEventFromCache(args.where.jobId)
        if (cachedData && eventIsFinal(cachedData)) {
          done = true
          return { value: cachedData }
        }
      }

      // inspect values to eagerly end iteration for jobId subscribers when the event is final
      const next = await iterator.next.call(iterator)
      if (!next.done && args?.where?.jobId && eventIsFinal(next.value)) done = true
      return next
    },
    return: iterator.return!.bind(iterator),
    throw: iterator.throw!.bind(iterator),
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
