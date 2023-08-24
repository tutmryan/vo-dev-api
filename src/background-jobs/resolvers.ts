import type { Resolvers } from '../generated/graphql'
import { resolveBackgroundJobEventData, subscribeToBackgroundJobEventsWithFilter } from './pubsub'

export const resolvers: Resolvers = {
  Subscription: {
    backgroundJobEvent: {
      subscribe: subscribeToBackgroundJobEventsWithFilter,
      resolve: resolveBackgroundJobEventData,
    },
  },
}
