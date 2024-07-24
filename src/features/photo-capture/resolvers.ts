import { dispatch, query } from '../../cqs'
import type { PhotoCaptureEventData, Resolvers } from '../../generated/graphql'
import { CapturePhotoCommand } from './commands/capture-photo-command'
import { CreatePhotoCaptureRequestCommand } from './commands/create-photo-capture-request-command'
import { PhotoCaptureStatusQuery } from './queries/photo-capture-status-query'
import { subscribeToPhotoCaptureEventsWithFilter } from './subscription/pubsub'

export const resolvers: Resolvers = {
  Mutation: {
    createPhotoCaptureRequest: async (_, { request }, context) => dispatch(context, CreatePhotoCaptureRequestCommand, request),
    capturePhoto: async (_, { photoCaptureRequestId, photo }, context) =>
      dispatch(context, CapturePhotoCommand, photoCaptureRequestId, photo),
  },
  Subscription: {
    photoCaptureEvent: {
      subscribe: subscribeToPhotoCaptureEventsWithFilter,
      resolve: ({ eventData }: { eventData: PhotoCaptureEventData }) => eventData,
    },
  },
  Query: {
    photoCaptureStatus: async (_, { photoCaptureRequestId }, context) => query(context, PhotoCaptureStatusQuery, photoCaptureRequestId),
  },
}
