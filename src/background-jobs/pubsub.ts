import type { GraphQLContext } from '@makerx/graphql-core'
import { withFilter } from 'graphql-subscriptions'
import { entityManager } from '../data'
import { UserEntity } from '../features/users/entities/user-entity'
import {
  BackgroundJobStatus,
  type BackgroundJobEvent,
  type BackgroundJobEventData,
  type InputMaybe,
  type SubscriptionBackgroundJobEventArgs,
  type SubscriptionSubscribeFn,
} from '../generated/graphql'
import { newCacheSection, ONE_MINUTE_TTL } from '../redis/cache'
import { pubsub } from '../redis/pubsub'
import { Lazy } from '../util/lazy'

const BACKGROUND_JOB_TOPIC = 'backgroundJob'
const BACKGROUND_JOB_EVENTS_TTL = ONE_MINUTE_TTL * 5 // 5 minutes
const finishedBackgroundJobEvents = Lazy(() => newCacheSection('finishedBackgroundJobEvents', BACKGROUND_JOB_EVENTS_TTL))

export type BackgroundJobTopicData = {
  jobId: string
  jobName: string
  event: BackgroundJobEvent
  userId?: string
}

export const eventIsFinal = ({ status }: BackgroundJobEvent) => [BackgroundJobStatus.Completed, BackgroundJobStatus.Failed].includes(status)

export const publishBackgroundJobEvent = async (data: BackgroundJobTopicData): Promise<void> => {
  // keep a copy of the job finished event in cache so that
  // we can immediately return the event to any subscriber
  // subscribing after the event has happened
  if (eventIsFinal(data.event)) await finishedBackgroundJobEvents().set(data.jobId, JSON.stringify(data))
  return pubsub().publish(BACKGROUND_JOB_TOPIC, data)
}

const getJobFinishedEventFromCache = async (jobId?: InputMaybe<string>): Promise<BackgroundJobTopicData | null> => {
  if (!jobId) return null
  const cachedValue = await finishedBackgroundJobEvents().get(jobId)
  return cachedValue ? (JSON.parse(cachedValue) as BackgroundJobTopicData) : null
}

export const subscribeToBackgroundJobEvents = (
  args?: SubscriptionBackgroundJobEventArgs,
): AsyncIterator<BackgroundJobEventData> & AsyncIterable<BackgroundJobEventData> => {
  const wrapped = pubsub().asyncIterator<BackgroundJobTopicData>(BACKGROUND_JOB_TOPIC)

  let count = 0
  let done = false

  const iterator: AsyncIterator<BackgroundJobEventData> = {
    next: async () => {
      // eagerly end iteration
      if (done) return { done: true, value: undefined }

      // when subscribing by jobId
      if (count++ === 0 && args?.where?.jobId) {
        // check for cached final event data
        const cachedData = await getJobFinishedEventFromCache(args.where.jobId)
        if (cachedData && eventIsFinal(cachedData.event)) {
          done = true
          return { value: cachedData }
        }
      }

      // inspect values to eagerly end iteration for jobId subscribers when the event is final
      const next = await wrapped.next.call(wrapped)
      if (!next.done && args?.where?.jobId && eventIsFinal(next.value.event)) done = true
      return next
    },
    return: wrapped.return!.bind(wrapped),
    throw: wrapped.throw!.bind(wrapped),
  }

  return { ...iterator, [Symbol.asyncIterator]: () => iterator }
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
