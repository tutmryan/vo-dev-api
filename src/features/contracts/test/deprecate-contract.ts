import { graphql } from '../../../generated'

export const deprecateContractMutation = graphql(
  `
  mutation DeprecateContract($id: ID!) {
    deprecateContract(id: $id) {
      ...ContractFragment,
      externalId,
      provisionedAt,
      lastProvisionedAt,
      isDeprecated,
      deprecatedAt
    }
  }
` as const,
)
