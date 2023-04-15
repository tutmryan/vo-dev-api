import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { resolveUpdatedAt } from '../auditing/updated-at-resolver'
import { CreateContractCommand } from './commands/create-contract-command'
import { UpdateContractCommand } from './commands/update-contract-command'
import { FindContractsQuery } from './queries/find-contracts-query'
import { GetContractQuery } from './queries/get-contract-query'
import { ProvisionContractCommand } from './commands/provision-contract-command'
import { DeleteContractCommand } from './commands/delete-contract-command'

export const resolvers: Resolvers = {
  Query: {
    findContracts: (_, { where, offset, limit }, context) => query(context, FindContractsQuery, where, offset, limit),
    contract: (_, { id }, context) => query(context, GetContractQuery, id),
  },
  Mutation: {
    createContract: (_, { input }, context) => dispatch(context, CreateContractCommand, input),
    updateContract: (_, { id, input }, context) => dispatch(context, UpdateContractCommand, id, input),
    deleteContract: (_, { id }, context) => dispatch(context, DeleteContractCommand, id),
    provisionContract: (_, { id }, context) => dispatch(context, ProvisionContractCommand, id),
  },
  Contract: {
    updatedAt: resolveUpdatedAt,
  },
}
