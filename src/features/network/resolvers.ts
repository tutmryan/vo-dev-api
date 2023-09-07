import { dispatch } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateOrUpdatePartnerCommand } from './commands/create-or-update-partner'

export const resolvers: Resolvers = {
  Mutation: {
    savePartner: (_, { input }, context) => dispatch(context, CreateOrUpdatePartnerCommand, input),
  },
  Query: {
    findNetworkIssuers: (_, { where }, { services: { admin } }) => admin.findNetworkIssuers(where),
    networkContracts: (_, { tenantId, issuerId }, { services: { admin } }) => admin.networkContracts(tenantId, issuerId),
  },
}
