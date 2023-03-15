import type { Resolvers } from '../../generated/graphql'

export const resolvers: Resolvers = {
  Query: {
    healthcheck: () => void 0,
  },
}
