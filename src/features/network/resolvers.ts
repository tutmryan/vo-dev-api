import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreatePartnerCommand } from './commands/create-partner-command'
import { UpdatePartnerCommand } from './commands/update-partner-command'
import { FindPartnersQuery } from './queries/find-partners-query'

export const resolvers: Resolvers = {
  Mutation: {
    createPartner: (_, { input }, context) => dispatch(context, CreatePartnerCommand, input),
    updatePartner: (_, { id, input }, context) => dispatch(context, UpdatePartnerCommand, id, input),
  },
  Query: {
    findNetworkIssuers: (_, { where }, { services: { admin } }) => admin.findNetworkIssuers(where),
    networkContracts: (_, { tenantId, issuerId }, { services: { admin } }) => admin.networkContracts(tenantId, issuerId),
    findPartners: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindPartnersQuery, where, offset, limit, orderBy, orderDirection),
    partner: (_, { id }, { dataLoaders: { partners } }) => partners.load(id),
  },
}
