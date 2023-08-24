import { query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { FindUsersQuery } from './queries/find-users-query'

export const resolvers: Resolvers = {
  Query: {
    user: (_, { id }, { dataLoaders: { users } }) => users.load(id),
    findUsers: (_parent, { where, offset, limit }, context) => query(context, FindUsersQuery, where, offset, limit),
  },
  Template: {
    createdBy: ({ createdById }, _, { dataLoaders: { users } }) => users.load(createdById),
    updatedBy: ({ createdById }, _, { dataLoaders: { users } }) => users.load(createdById),
  },
  Contract: {
    createdBy: ({ createdById }, _, { dataLoaders: { users } }) => users.load(createdById),
    updatedBy: ({ createdById }, _, { dataLoaders: { users } }) => users.load(createdById),
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
}
