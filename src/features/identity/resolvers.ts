import { dispatch, query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateOrUpdateIdentityCommand } from './commands/create-or-update-identity'
import { resolveIssuerLabel } from './issuer-label-resolver'
import { FindIdentitiesQuery } from './queries/find-identities-query'
import { FindTenantIdentitiesQuery } from './queries/find-tenant-identities-query'
import { IdentityIssuersQuery } from './queries/identity-issuers-query'

export const resolvers: Resolvers = {
  Mutation: {
    saveIdentity: (_, { input }, context) => dispatch(context, CreateOrUpdateIdentityCommand, input),
  },
  Query: {
    identity: (_, { id }, { dataLoaders: { identities } }) => identities.load(id),
    findIdentities: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindIdentitiesQuery, where, offset, limit, orderBy, orderDirection),
    findTenantIdentities: (_, { where, limit }, context) => query(context, FindTenantIdentitiesQuery, where, limit),
    identityIssuers: (_, __, context) => query(context, IdentityIssuersQuery),
  },
  Identity: {
    issuerLabel: resolveIssuerLabel,
  },
  Issuance: {
    identity: ({ identityId }, _, { dataLoaders: { identities } }) => identities.load(identityId),
  },
  Presentation: {
    identity: ({ identityId }, _, { dataLoaders: { identities } }) => (identityId ? identities.load(identityId) : null),
  },
}
