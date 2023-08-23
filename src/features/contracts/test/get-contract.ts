import { graphql } from '../../../generated'
import { executeOperationAsAdmin } from '../../../test'

export const getContractQuery = graphql(
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

  return data!.contract
}
