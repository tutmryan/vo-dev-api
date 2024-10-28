import casual from 'casual'
import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import { ClaimType, type ContractInput } from '../../../generated/graphql'
import { executeOperationAsCredentialAdmin, fakeJpegDataURL } from '../../../test'
import type { DeepPartial } from '../../../util/type-helpers'
import { resolveToType } from '../../../util/type-helpers'
import { convertToClaimValidationInput } from '../mapping'
import { notSupportedCredentialTypes } from '../validation'

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
    isPublic: true,
    validityIntervalInSeconds: 1_440,
    credentialTypes: ['DefaultCredential'],
    display: {
      locale: 'en-AU',
      card: {
        title: 'Credential title',
        description: 'Credential description',
        issuedBy: 'Credential issuer',
        logo: { description: 'Logo description', image: fakeJpegDataURL() },
        textColor: '#ffffff',
        backgroundColor: '#000000',
      },
      consent: {},
      claims: [],
    },
  }
}

export function getUnsupportedCredentialTypeContractInput(): ContractInput {
  return { ...getDefaultContractInput(), credentialTypes: notSupportedCredentialTypes }
}

export async function createContract(input: ContractInput) {
  const { data, errors } = await executeOperationAsCredentialAdmin({
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

const generateClaimAndLabelTitles = () => {
  const thingName = casual.full_name
  return {
    claim: thingName,
    label: thingName.replaceAll('_', ' '),
  }
}

export function buildContractInput(args: DeepPartial<ContractInput>): ContractInput {
  return {
    name: randomUUID(),
    templateId: null,
    isPublic: true,
    validityIntervalInSeconds: 1000,
    credentialTypes: ['DefaultCredential'],
    ...args,
    display: resolveToType<ContractInput['display']>({
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
          image: fakeJpegDataURL(),
          description: 'Logo description',
          ...args.display?.card?.logo,
        },
      },
      consent: {
        title: 'Consent title',
        instructions: 'Consent instructions',
        ...args.display?.consent,
      },
      claims: args.display?.claims
        ? args.display.claims.map((c) => ({
            ...generateClaimAndLabelTitles(),
            ...c,
            type: c.type || ClaimType.String,
            validation: convertToClaimValidationInput(c.validation),
          }))
        : resolveToType<ContractInput['display']['claims']>([
            { claim: 'claim_one', label: 'Claim 1', type: ClaimType.String, value: 'Claim 1' },
            { claim: 'claim_two', label: 'Claim 2', type: ClaimType.String, value: 'Claim 2' },
          ]),
    }),
  }
}
