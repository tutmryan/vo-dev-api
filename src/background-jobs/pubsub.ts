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
import { pubsub, subscribeToCachedEvents } from '../redis/pubsub'
import { Lazy } from '../util/lazy'
import { getJobConfig } from './jobs'

const BACKGROUND_JOB_TOPIC = 'backgroundJob'
const BACKGROUND_JOB_EVENTS_TTL = ONE_MINUTE_TTL * 5 // 5 minutes
const finishedBackgroundJobEvents = Lazy(() => newCacheSection('finishedBackgroundJobEvents', BACKGROUND_JOB_EVENTS_TTL))

export type BackgroundJobTopicData = {
  jobId: string
  jobName: string
  event: BackgroundJobEvent
  userId?: string
}

export const eventIsFinal = (data: BackgroundJobEventData) =>
  [BackgroundJobStatus.Completed, BackgroundJobStatus.Failed].includes(data.event.status)

export const publishBackgroundJobEvent = async (data: BackgroundJobTopicData): Promise<void> => {
  // keep a copy of the job finished event in cache so that
  // we can immediately return the event to any subscriber
  // subscribing after the event has happened
  const ttl = getJobConfig(data.jobName)?.resultCacheTtl // use the job's result cache ttl to override the default, if specified
  if (eventIsFinal(data)) await finishedBackgroundJobEvents().set(data.jobId, JSON.stringify(data), ttl)
  return pubsub().publish(`${BACKGROUND_JOB_TOPIC}.${data.jobId}`, data)
}

const getJobFinishedEventFromCache = async (jobId?: InputMaybe<string>): Promise<BackgroundJobTopicData | undefined> => {
  if (!jobId) return undefined
  const cachedValue = await finishedBackgroundJobEvents().get(jobId)
  return cachedValue ? (JSON.parse(cachedValue) as BackgroundJobTopicData) : undefined
}

export const subscribeToBackgroundJobEvents = (
  args?: SubscriptionBackgroundJobEventArgs,
): AsyncIterator<BackgroundJobEventData> & AsyncIterable<BackgroundJobEventData> => {
  const jobIdArg = args?.where?.jobId
  return subscribeToCachedEvents<BackgroundJobTopicData>({
    eventId: jobIdArg ?? undefined,
    topic: BACKGROUND_JOB_TOPIC,
    getFromCache: getJobFinishedEventFromCache,
    eventIsFinal,
  })
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
