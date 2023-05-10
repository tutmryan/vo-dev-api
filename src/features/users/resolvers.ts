import config from '../../config'
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
  },
  Issuance: {
    user: ({ userId }, _, { dataLoaders: { users } }) => users.load(userId),
  },
  Presentation: {
    user: ({ userId }, _, { dataLoaders: { users } }) => users.load(userId),
  },
  User: {
    name: ({ name, isApp, oid }) => {
      if (!isApp) return name
      return config.get('platformConsumerApps')[oid]?.name ?? name
    },
  },
}
