import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateOrUpdateIdentityCommand } from './commands/create-or-update-identity'
import { resolveIssuer } from './issuer-resolver'
import { FindIdentitiesQuery } from './queries/find-identities-query'
import { FindTenantIdentitiesQuery } from './queries/find-tenant-identities-query'

export const resolvers: Resolvers = {
  Mutation: {
    saveIdentity: (_, { input }, context) => dispatch(context, CreateOrUpdateIdentityCommand, input),
  },
  Query: {
    identity: (_, { id }, { dataLoaders: { identities } }) => identities.load(id),
    findIdentities: (_, { where, offset, limit }, context) => query(context, FindIdentitiesQuery, where, offset, limit),
    findTenantIdentities: (_, { where, limit }, context) => query(context, FindTenantIdentitiesQuery, where, limit),
  },
  Identity: {
    issuer: resolveIssuer,
  },
  Issuance: {
    identity: ({ identityId }, _, { dataLoaders: { identities } }) => identities.load(identityId),
  },
  Presentation: {
    identity: ({ identityId }, _, { dataLoaders: { identities } }) => (identityId ? identities.load(identityId) : null),
  },
}
