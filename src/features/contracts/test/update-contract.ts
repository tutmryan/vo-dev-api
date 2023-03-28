import { graphql } from '../../../generated'
import { omit } from 'lodash'
import type { ContractFragmentFragment, ContractInput } from '../../../generated/graphql'

export const updateContractMutation = graphql(
  `
  mutation UpdateContract($id: ID!, $input: ContractInput!) {
    updateContract(id: $id, input: $input) {
      ...ContractFragment
    }
  }
` as const,
)

export function getUpdateContractInput(contract: ContractFragmentFragment): ContractInput {
  return omit(contract, 'id', 'template')
}
