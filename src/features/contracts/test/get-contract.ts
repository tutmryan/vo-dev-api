import { graphql, useFragment } from '../../../generated'
import { executeOperationAsAdmin } from '../../../test'
import { ContractFragment } from './create-contract'

const getContractQuery = graphql(
  `
  query GetContract($id: ID!) {
    contract(id: $id) {
      ...ContractFragment
    }
  }` as const,
)

export async function getContract(id: string) {
  const { data, errors } = await executeOperationAsAdmin({
    query: getContractQuery,
    variables: { id },
  })

  if (errors) {
    throw new Error(`Error while getting the contract: ${JSON.stringify(errors)}`)
  }

  return useFragment(ContractFragment, data!.contract)
}
