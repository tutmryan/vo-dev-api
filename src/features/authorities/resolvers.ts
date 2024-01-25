import type { Resolvers } from '../../generated/graphql'

export const resolvers: Resolvers = {
  Query: {
    authority: (_parent, _args, { services: { verifiedIdAdmin } }) => verifiedIdAdmin.authority(),
  },
}
