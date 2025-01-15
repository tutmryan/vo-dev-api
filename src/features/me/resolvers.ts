import type { Resolvers } from '../../generated/graphql'
import { UserEntity } from '../users/entities/user-entity'

export const resolvers: Resolvers = {
  Query: {
    me: (_, __, context) => context.user?.entity ?? null,
  },
  Me: {
    __resolveType: (me) => (me instanceof UserEntity ? 'User' : 'Identity'),
  },
}
