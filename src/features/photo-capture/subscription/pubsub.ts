import type { GraphQLContext } from '@makerx/graphql-core'
import { withFilter } from 'graphql-subscriptions'
import type { PhotoCaptureData } from '..'
import { getPhotoCaptureData } from '..'
import {
  PhotoCaptureStatus,
  type PhotoCaptureEventData,
  type SubscriptionPhotoCaptureEventArgs,
  type SubscriptionSubscribeFn,
} from '../../../generated/graphql'
import { pubsub } from '../../../redis/pubsub'
import { invariant } from '../../../util/invariant'
import { addPhotoCaptureEventDataToCache, getPhotoCaptureEventDataFromCache } from './cache'

const photoCaptureTopic = (photoCaptureRequestId: string) => `photo-capture.${photoCaptureRequestId}`

export type PhotoCaptureTopicData = Pick<PhotoCaptureData, 'photoCaptureRequestId'> & { eventData: PhotoCaptureEventData }

export const publishPhotoCaptureEvent = async (data: PhotoCaptureTopicData): Promise<void> => {
  await addPhotoCaptureEventDataToCache(data)
  await pubsub().publish(photoCaptureTopic(data.photoCaptureRequestId), data)
}

const eventIsFinal = (eventData: PhotoCaptureEventData) => eventData.status === PhotoCaptureStatus.Complete

export const subscribeToPhotoCaptureEvents = (args: SubscriptionPhotoCaptureEventArgs) => {
  const iterator = pubsub().asyncIterator<PhotoCaptureTopicData>(photoCaptureTopic(args.photoCaptureRequestId))

  let count = 0
  let done = false

  return {
    next: async () => {
      // eagerly end iteration
      if (done) return { done: true, value: undefined }

      // when subscribing
      if (count++ === 0) {
        // check for cached final event data
        const cachedData = await getPhotoCaptureEventDataFromCache(args.photoCaptureRequestId)
        if (cachedData && eventIsFinal(cachedData.eventData)) {
          done = true
          return { value: cachedData }
        }

        // otherwise, validate that the photo capture request is still in progress
        const inProgressData = await getPhotoCaptureData(args.photoCaptureRequestId)
        invariant(inProgressData, 'The requested photo capture request was not found or was completed some time ago')
      }

      // inspect values to eagerly end iteration when the event is final
      const next = await iterator.next.call(iterator)
      if (!next.done && eventIsFinal(next.value.eventData)) done = true
      return next
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
