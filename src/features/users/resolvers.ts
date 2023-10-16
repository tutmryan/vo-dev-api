import type { GraphQLContext } from '../../context'
import { query } from '../../cqrs/dispatcher'
import type { Resolver, Resolvers, ResolversTypes } from '../../generated/graphql'
import { FindUsersQuery } from './queries/find-users-query'

type CreatedByUpdatedByResolvers = {
  createdBy: Resolver<ResolversTypes['User'], { createdById: string }, GraphQLContext>
  updatedBy: Resolver<ResolversTypes['User'] | null, { updatedById: string | null }, GraphQLContext>
}

const createdByUpdatedBy: CreatedByUpdatedByResolvers = {
  createdBy: ({ createdById }, _, { dataLoaders: { users } }) => users.load(createdById),
  updatedBy: ({ updatedById }, _, { dataLoaders: { users } }) => (updatedById ? users.load(updatedById) : null),
}

export const resolvers: Resolvers = {
  Query: {
    user: (_, { id }, { dataLoaders: { users } }) => users.load(id),
    findUsers: (_parent, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindUsersQuery, where, offset, limit, orderBy, orderDirection),
  },
  Template: {
    ...createdByUpdatedBy,
  },
  Contract: {
    ...createdByUpdatedBy,
    provisionedBy: ({ provisionedById }, _, { dataLoaders: { users } }) => (provisionedById ? users.load(provisionedById) : null),
    lastProvisionedBy: ({ lastProvisionedById }, _, { dataLoaders: { users } }) =>
      lastProvisionedById ? users.load(lastProvisionedById) : null,
    deprecatedBy: ({ deprecatedById }, _, { dataLoaders: { users } }) => (deprecatedById ? users.load(deprecatedById) : null),
  },
  Issuance: {
    issuedBy: ({ issuedById }, _, { dataLoaders: { users } }) => users.load(issuedById),
    revokedBy: ({ revokedById }, _, { dataLoaders: { users } }) => (revokedById ? users.load(revokedById) : null),
  },
  Presentation: {
    requestedBy: ({ requestedById }, _, { dataLoaders: { users } }) => users.load(requestedById),
  },
  Identity: {
    ...createdByUpdatedBy,
  },
  Partner: {
    ...createdByUpdatedBy,
  },
}
