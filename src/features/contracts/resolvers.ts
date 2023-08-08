import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { resolveUpdatedAt } from '../auditing/updated-at-resolver'
import { CreateContractCommand } from './commands/create-contract-command'
import { DeleteContractCommand } from './commands/delete-contract-command'
import { ProvisionContractCommand } from './commands/provision-contract-command'
import { UpdateContractCommand } from './commands/update-contract-command'
import { FindContractsQuery } from './queries/find-contracts-query'

export const resolvers: Resolvers = {
  Query: {
    findContracts: (_, { where, offset, limit }, context) => query(context, FindContractsQuery, where, offset, limit),
    contract: (_, { id }, { dataLoaders: { contracts } }) => contracts.load(id),
  },
  Mutation: {
    createContract: (_, { input }, context) => dispatch(context, CreateContractCommand, input),
    updateContract: (_, { id, input }, context) => dispatch(context, UpdateContractCommand, id, input),
    deleteContract: (_, { id }, context) => dispatch(context, DeleteContractCommand, id),
    provisionContract: (_, { id }, context) => dispatch(context, ProvisionContractCommand, id),
  },
  Contract: {
    updatedAt: resolveUpdatedAt,
    template: ({ templateId }, _, { dataLoaders: { templates } }) => (templateId ? templates.load(templateId) : null),
    templateData: async ({ templateId }, _, { dataLoaders: { templates } }) => {
      if (!templateId) return null
      const template = await templates.load(templateId)
      return template.combinedData()
    },
  },
  Issuance: {
    contract: ({ contractId }, _, { dataLoaders: { contracts } }) => contracts.load(contractId),
  },
}
