import type { Resolvers } from '../../generated/graphql'
import { dispatch, query } from '../../cqrs/dispatcher'
import { FindContractsQuery } from './queries/find-contracts-query'
import { GetContractQuery } from './queries/get-contract-query'
import { CreateContractCommand } from './commands/create-contract-command'
import { UpdateContractCommand } from './commands/update-contract-command'

export const resolvers: Resolvers = {
  Query: {
    findContracts: (_, { where, offset, limit }, context) => query(context, FindContractsQuery, where, offset, limit),
    contract: (_, { id }, context) => query(context, GetContractQuery, id),
  },
  Mutation: {
    createContract: (_, { input }, context) => dispatch(context, CreateContractCommand, input),
    updateContract: (_, { id, input }, context) => dispatch(context, UpdateContractCommand, id, input),
  },
}
