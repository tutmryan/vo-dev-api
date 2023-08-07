import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import type { ContractInput } from '../../../generated/graphql'
import { executeOperationAsAdmin } from '../../../test'

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

  return data!.createContract
}

export function buildContractInput(args: Partial<ContractInput>): ContractInput {
  return {
    name: randomUUID(),
    description: randomUUID(),
    templateId: null,
    isPublic: true,
    validityIntervalInSeconds: 1000,
    credentialTypes: ['DefaultCredential'],
    ...args,
    display: {
      locale: 'en-AU',
      ...args.display,
      card: {
        title: 'Card title',
        description: 'Card description',
        backgroundColor: '#123123',
        textColor: '#321321',
        issuedBy: 'Card issuer',
        ...args.display?.card,
        logo: {
          image: 'https://image.com/image.png',
          description: 'Logo description',
          ...args.display?.card.logo,
        },
      },
      consent: {
        title: 'Consent title',
        instructions: 'Consent instructions',
        ...args.display?.consent,
      },
      claims: args.display?.claims || [
        { claim: 'claim_one', label: 'Claim 1', type: 'String', value: 'Claim 1' },
        { claim: 'claim_two', label: 'Claim 2', type: 'String', value: 'Claim 2' },
      ],
    },
    ...args,
  }
}
