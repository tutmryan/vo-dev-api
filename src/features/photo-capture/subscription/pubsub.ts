import type { GraphQLContext } from '@makerx/graphql-core'
import { withFilter } from 'graphql-subscriptions'
import type { PhotoCaptureData } from '..'
import { getPhotoCaptureData } from '..'
import { pubsub } from '../../../cache'
import {
  PhotoCaptureStatus,
  type PhotoCaptureEventData,
  type SubscriptionPhotoCaptureEventArgs,
  type SubscriptionSubscribeFn,
} from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { addPhotoCaptureEventDataToCache, getPhotoCaptureEventDataFromCache } from './cache'

const PHOTO_CAPTURE_TOPIC = 'photo-capture'

export type PhotoCaptureTopicData = Pick<PhotoCaptureData, 'photoCaptureRequestId'> & { eventData: PhotoCaptureEventData }

export const publishPhotoCaptureEvent = async (data: PhotoCaptureTopicData): Promise<void> => {
  await pubsub.publish(PHOTO_CAPTURE_TOPIC, data)
  await addPhotoCaptureEventDataToCache(data)
}

export const subscribeToPhotoCaptureEvents = (args: SubscriptionPhotoCaptureEventArgs) => {
  let count = 0
  const iterator = pubsub.asyncIterator<PhotoCaptureEventData>(PHOTO_CAPTURE_TOPIC)
  return {
    next: async () => {
      // check for cached completed event data and return it
      const cachedData = await getPhotoCaptureEventDataFromCache(args.photoCaptureRequestId)
      if (cachedData && cachedData.eventData.status === PhotoCaptureStatus.Complete) return { done: count++ === 1, value: cachedData }
      // validate that the photo capture request is still in progress
      const inProgressData = await getPhotoCaptureData(args.photoCaptureRequestId)
      invariant(inProgressData, 'The requested photo capture request was not found or was completed some time ago')
      // use the pubsub iterator to receive the next event
      return iterator.next.call(iterator)
    },
    return: iterator.return!.bind(iterator),
    throw: iterator.throw!.bind(iterator),
  }
}

export const subscribeToPhotoCaptureEventsWithFilter = withFilter(
  (_, args: SubscriptionPhotoCaptureEventArgs) => subscribeToPhotoCaptureEvents(args),
  (data: PhotoCaptureTopicData, args: SubscriptionPhotoCaptureEventArgs) => {
    return data.photoCaptureRequestId === args.photoCaptureRequestId
  },
) as any as SubscriptionSubscribeFn<PhotoCaptureTopicData, any, GraphQLContext, SubscriptionPhotoCaptureEventArgs>
