import { dispatch } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateOrUpdateIdentityCommand } from './commands/create-or-update-identity'

export const resolvers: Resolvers = {
  Mutation: {
    saveIdentity: (_, { input }, context) => dispatch(context, CreateOrUpdateIdentityCommand, input),
  },
  Query: {
    identity: (_, { id }, { dataLoaders: { identities } }) => identities.load(id),
  },
  Issuance: {
    identity: ({ identityId }, _, { dataLoaders: { identities } }) => identities.load(identityId),
  },
  Presentation: {
    identity: ({ identityId }, _, { dataLoaders: { identities } }) => (identityId ? identities.load(identityId) : null),
  },
}
