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
    // We are now starting to store the friendly name for apps in the users table (see context#findUpdateOrCreateUser)
    // This resolver can 'fix' any DB entries that don't have a friendly name, they'll have the OID as the name
    name: ({ name, isApp, oid }) => {
      if (!isApp) return name
      return config.get('platformConsumerApps')[oid.toLowerCase()]?.name ?? name
    },
  },
}
