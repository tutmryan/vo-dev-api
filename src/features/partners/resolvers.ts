import { dispatch, query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { compactErrors } from '../../util/compact-errors'
import { CreatePartnerCommand } from './commands/create-partner-command'
import { DeletePartnerCommand } from './commands/delete-partner-command'
import { UpdatePartnerCommand } from './commands/update-partner-command'
import { FindPartnersQuery } from './queries/find-partners-query'

export const resolvers: Resolvers = {
  Mutation: {
    createPartner: (_, { input }, context) => dispatch(context, CreatePartnerCommand, input),
    updatePartner: (_, { id, input }, context) => dispatch(context, UpdatePartnerCommand, id, input),
    deletePartner: async (_parent, { id }, context) => dispatch(context, DeletePartnerCommand, id),
  },
  Query: {
    findNetworkIssuers: (_, { where }, { services: { verifiedIdAdmin } }) => verifiedIdAdmin.findNetworkIssuers(where),
    networkContracts: (_, { tenantId, issuerId }, { services: { verifiedIdAdmin } }) =>
      verifiedIdAdmin.networkContracts(tenantId, issuerId),
    findPartners: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindPartnersQuery, where, offset, limit, orderBy, orderDirection),
    partner: (_, { id }, { dataLoaders: { partners } }) => partners.load(id),
  },
  Presentation: {
    partners: (presentation, _, { dataLoaders: { presentationPartnersLoader } }) =>
      presentationPartnersLoader.load(presentation.id).then(compactErrors),
  },
}
