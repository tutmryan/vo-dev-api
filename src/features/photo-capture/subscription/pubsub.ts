import type { GraphQLContext } from '@makerx/graphql-core'
import { withFilter } from 'graphql-subscriptions'
import { getPhotoCaptureData, type PhotoCaptureData } from '..'
import {
  PhotoCaptureStatus,
  type PhotoCaptureEventData,
  type SubscriptionPhotoCaptureEventArgs,
  type SubscriptionSubscribeFn,
} from '../../../generated/graphql'
import { pubsub, subscribeToCachedEvents } from '../../../redis/pubsub'
import { invariant } from '../../../util/invariant'
import { addPhotoCaptureEventDataToCache, getPhotoCaptureEventDataFromCache } from './cache'

const PHOTO_CAPTURE_TOPIC = 'photoCapture'

export type PhotoCaptureTopicData = Pick<PhotoCaptureData, 'photoCaptureRequestId'> & { eventData: PhotoCaptureEventData }

export const publishPhotoCaptureEvent = async (data: PhotoCaptureTopicData): Promise<void> => {
  await addPhotoCaptureEventDataToCache(data)
  await pubsub().publish(`${PHOTO_CAPTURE_TOPIC}.${data.photoCaptureRequestId}`, data)
}

const eventIsFinal = (data: PhotoCaptureTopicData) => data.eventData.status === PhotoCaptureStatus.Complete

const subscribeToPhotoCaptureEvents = (args: SubscriptionPhotoCaptureEventArgs) =>
  subscribeToCachedEvents<PhotoCaptureTopicData>({
    eventId: args.photoCaptureRequestId,
    topic: PHOTO_CAPTURE_TOPIC,
    getFromCache: getPhotoCaptureEventDataFromCache,
    eventIsFinal,
    onSubscribeValidate: async () => {
      // validate that the photo capture request is still in progress, e.g. the session data still exists, otherwise the subscription is invalid
      const inProgressData = await getPhotoCaptureData(args.photoCaptureRequestId)
      invariant(inProgressData, 'The requested photo capture request was not found or was completed some time ago')
    },
  })

export const subscribeToPhotoCaptureEventsWithFilter = withFilter(
  (_, args) => subscribeToPhotoCaptureEvents(args),
  (data: PhotoCaptureTopicData, args: SubscriptionPhotoCaptureEventArgs) => {
    return data.photoCaptureRequestId === args.photoCaptureRequestId
  },
) as any as SubscriptionSubscribeFn<PhotoCaptureTopicData, any, GraphQLContext, SubscriptionPhotoCaptureEventArgs>
