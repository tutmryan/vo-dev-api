import { dispatch, query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateIdentityStoreCommand } from './commands/create-identity-store-command'
import { ResumeIdentityStoreCommand } from './commands/resume-identity-store-command'
import { SuspendIdentityStoreCommand } from './commands/suspend-identity-store-command'
import { UpdateIdentityStoreCommand } from './commands/update-identity-store-command'

import { FindIdentityStoresQuery } from './queries/find-identity-stores-query'
import { TestIdentityStoreGraphClientQuery } from './queries/test-identity-store-graph-client-query'

export const resolvers: Resolvers = {
  Query: {
    findIdentityStores: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindIdentityStoresQuery, where, offset, limit, orderBy, orderDirection),
    testIdentityStoreGraphClient: (_, { identityStoreId }, context) => query(context, TestIdentityStoreGraphClientQuery, identityStoreId),
    identityStore: (_, { id }, { dataLoaders: { identityStores } }) => identityStores.load(id),
  },
  Mutation: {
    createIdentityStore: (_, { input }, context) => dispatch(context, CreateIdentityStoreCommand, input),
    updateIdentityStore: (_, { id, input }, context) => dispatch(context, UpdateIdentityStoreCommand, id, input),
    suspendIdentityStore: async (_parent, { id }, context) => dispatch(context, SuspendIdentityStoreCommand, id),
    resumeIdentityStore: async (_parent, { id }, context) => dispatch(context, ResumeIdentityStoreCommand, id),
  },
  IdentityStore: {
    suspendedAt: (parent) => parent.deletedAt,
  },
}
