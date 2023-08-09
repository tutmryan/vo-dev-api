import { graphql } from '../../../generated'

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
