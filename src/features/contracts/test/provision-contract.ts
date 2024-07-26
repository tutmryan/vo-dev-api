import { graphql } from '../../../generated'
import { executeOperationAsCredentialAdmin } from '../../../test'
import { mockAdminServiceHelper } from '../../../test/mock-services'

export const provisionContractMutation = graphql(
  `
  mutation ProvisionContract($id: ID!) {
    provisionContract(id: $id) {
      ...ContractFragment,
      externalId,
      provisionedAt,
      lastProvisionedAt
    }
  }
` as const,
)

export async function provisionContract(contractId: string, externalContractId: string) {
  mockAdminServiceHelper.createContract.resolveWith(mockAdminServiceHelper.createContract.buildResolve({ id: externalContractId }))
  const { data, errors } = await executeOperationAsCredentialAdmin({
    query: provisionContractMutation,
    variables: {
      id: contractId,
    },
  })

  if (errors) {
    throw new Error(`Error while provisioning the contract: ${JSON.stringify(errors)}`)
  }

  return data!.provisionContract
}
