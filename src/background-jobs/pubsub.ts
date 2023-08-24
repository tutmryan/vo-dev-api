import type { GraphQLContext } from '@makerx/graphql-core'
import { withFilter } from 'graphql-subscriptions'
import { pubsub } from '../cache'
import { entityManager } from '../data'
import { UserEntity } from '../features/users/entities/user-entity'
import type {
  BackgroundJobEvent,
  BackgroundJobEventData,
  SubscriptionBackgroundJobEventArgs,
  SubscriptionSubscribeFn,
} from '../generated/graphql'

const BACKGROUND_JOB_TOPIC = 'backgroundJob'

export type BackgroundJobTopicData = {
  jobId: string
  jobName: string
  event: BackgroundJobEvent
  userId?: string
}

export const publishBackgroundJobEvent = async (data: BackgroundJobTopicData): Promise<void> => {
  pubsub.publish(BACKGROUND_JOB_TOPIC, data)
}

export const subscribeToBackgroundJobEvents = (_args?: SubscriptionBackgroundJobEventArgs) =>
  pubsub.asyncIterator<BackgroundJobTopicData>(BACKGROUND_JOB_TOPIC)

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
