import type { Resolvers } from '../../generated/graphql'

export const resolvers: Resolvers = {
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
    user: ({ userId }, _, { dataLoaders: { users } }) => users.load(userId),
  },
}
