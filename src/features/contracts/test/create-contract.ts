import { graphql, useFragment } from '../../../generated'
import type { ContractInput } from '../../../generated/graphql'
import { executeOperationAsAdmin } from '../../../test'
import { randomUUID } from 'crypto'

export const ContractFragment = graphql(
  `
  fragment ContractFragment on Contract {
    id
    name
    description
    template {
      id
      name
      description
      isPublic
      validityIntervalInSeconds
    }
    credentialTypes
    display {
      locale
      card {
        title
        issuedBy
        backgroundColor
        textColor
        description
        logo {
          uri
          image
          description
        }
      }
      consent {
        title
        instructions
      }
      claims {
        label
        claim
        type
        description
        value
      }
    }
    isPublic
    validityIntervalInSeconds
  }
` as const,
)

export const createContractMutation = graphql(
  `
  mutation CreateContract($input: ContractInput!) {
    createContract(input: $input) {
      ...ContractFragment
    }
  }
` as const,
)

export function getDefaultContractInput(): ContractInput {
  return {
    name: randomUUID(),
    description: randomUUID(),
    isPublic: true,
    validityIntervalInSeconds: 1_440,
    credentialTypes: ['DefaultCredential'],
    display: {
      locale: 'en-AU',
      card: {
        title: 'Credential title',
        description: 'Credential description',
        issuedBy: 'Credential issuer',
        logo: { description: 'Logo description' },
        textColor: '#ffffff',
        backgroundColor: '#000000',
      },
      consent: {},
      claims: [],
    },
  }
}

export async function createContract(input: ContractInput) {
  const { data, errors } = await executeOperationAsAdmin({
    query: createContractMutation,
    variables: {
      input,
    },
  })

  if (errors) {
    throw new Error(`Error while creating a contract: ${JSON.stringify(errors)}`)
  }

  return useFragment(ContractFragment, data!.createContract)
}
