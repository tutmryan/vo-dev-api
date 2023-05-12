import { omit } from 'lodash'
import { graphql } from '../../../generated'
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
  const input: ContractInput = omit(contract, 'id', 'template')
  if (contract.template) input.templateId = contract.template.id

  return input
}
