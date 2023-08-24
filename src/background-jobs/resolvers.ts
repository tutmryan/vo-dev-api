import type { Resolvers } from '../generated/graphql'
import { resolveBackgroundJobEventData, subscribeToBackgroundJobEventsWithFilter } from './pubsub'

export const resolvers: Resolvers = {
  BackgroundJobEvent: {
    __resolveType: (response) =>
      'error' in response
        ? 'BackgroundJobErrorEvent'
        : 'progress' in response
        ? 'BackgroundJobProgressEvent'
        : 'result' in response
        ? 'BackgroundJobCompletedEvent'
        : 'BackgroundJobActiveEvent',
  },
  Subscription: {
    backgroundJobEvent: {
      subscribe: subscribeToBackgroundJobEventsWithFilter,
      resolve: resolveBackgroundJobEventData,
    },
  },
}
