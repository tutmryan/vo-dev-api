import { dispatch, query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand } from './commands/create-microsoft-entra-temporary-access-pass-issuance-config-command'
import { DeleteMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand } from './commands/delete-microsoft-entra-temporary-access-pass-issuance-config-command'
import { SelfIssueMicrosoftEntraTemporaryAccessPassCommand } from './commands/self-issue-microsoft-entra-temporary-access-pass-command'
import { UpdateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand } from './commands/update-microsoft-entra-temporary-access-pass-issuance-config-command'
import { microsoftEntraTemporaryAccessPassService } from './microsoft-entra-temporary-access-pass-service'
import { FindMicrosoftEntraTemporaryAccessPassIssuanceConfigurationsQuery } from './queries/find-microsoft-entra-temporary-access-pass-issuance-configurations-query'
import { FindMicrosoftEntraTemporaryAccessPassIssuancesQuery } from './queries/find-microsoft-entra-temporary-access-pass-issuances-query'
import { GetMicrosoftEntraTemporaryAccessPassIssuanceConfigurationQuery } from './queries/get-microsoft-entra-temporary-access-pass-issuance-configuration-query'

export const resolvers: Resolvers = {
  SelfServiceAction: {
    identityStore: async (action) => {
      const store = (action as any).identityStore
      return store ?? null
    },
  },

  Identity: {
    availableSelfServiceActions: (identity: any) => {
      return microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
    },
  },
  MicrosoftEntraTemporaryAccessPassIssuance: {
    identity: (parent, _, { dataLoaders: { identities } }) => {
      if (!parent.identityId) return null
      return identities.load(parent.identityId)
    },
    identityStore: (parent, _, { dataLoaders: { identityStores } }) => {
      if (!parent.identityStoreId) return null
      return identityStores.load(parent.identityStoreId)
    },
  },
  Query: {
    microsoftEntraTemporaryAccessPassIssuanceConfigurations: (_, __, context) =>
      query(context, FindMicrosoftEntraTemporaryAccessPassIssuanceConfigurationsQuery),
    microsoftEntraTemporaryAccessPassIssuanceConfiguration: (_, { id }, context) =>
      query(context, GetMicrosoftEntraTemporaryAccessPassIssuanceConfigurationQuery, id),
    findMicrosoftEntraTemporaryAccessPassIssuances: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindMicrosoftEntraTemporaryAccessPassIssuancesQuery, where, offset, limit, orderBy, orderDirection),
    microsoftEntraTemporaryAccessPassIssuance: (_, { id }, { dataLoaders: { microsoftEntraTemporaryAccessPassIssuances } }) =>
      microsoftEntraTemporaryAccessPassIssuances.load(id),
  },
  Mutation: {
    selfIssueMicrosoftEntraTemporaryAccessPass: (_, __, context) => dispatch(context, SelfIssueMicrosoftEntraTemporaryAccessPassCommand),
    createMicrosoftEntraTemporaryAccessPassIssuanceConfiguration: (_, { input }, context) =>
      dispatch(context, CreateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand, input),
    updateMicrosoftEntraTemporaryAccessPassIssuanceConfiguration: (_, { id, input }, context) =>
      dispatch(context, UpdateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand, id, input),
    deleteMicrosoftEntraTemporaryAccessPassIssuanceConfiguration: (_, { id }, context) =>
      dispatch(context, DeleteMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand, id),
  },
}
