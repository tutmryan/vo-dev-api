import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import type { TemplateInput } from '../../../generated/graphql'
import { executeOperationAsCredentialAdmin, fakeJpegDataURL } from '../../../test'

export const TemplateFragment = graphql(
  `
  fragment TemplateFragment on Template {
    id
    name
    description
    parent {
      id
      name
      description
      isPublic
      validityIntervalInSeconds
    }
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
    credentialTypes
  }
` as const,
)

export const createTemplateMutation = graphql(
  `
  mutation CreateTemplate($input: TemplateInput!) {
    createTemplate(input: $input) {
      ...TemplateFragment
    }
  }
` as const,
)

export function getEmptyTemplateInput(): TemplateInput {
  return {
    name: randomUUID(),
  }
}

export async function createTemplate(input: TemplateInput) {
  const { data, errors } = await executeOperationAsCredentialAdmin({
    query: createTemplateMutation,
    variables: {
      input,
    },
  })

  if (errors) {
    throw new Error(`Error while creating a template: ${JSON.stringify(errors)}`)
  }

  return data!.createTemplate
}

export function buildTemplateInput(args: Partial<TemplateInput>): TemplateInput {
  return {
    name: randomUUID(),
    isPublic: true,
    ...args,
    display: {
      locale: 'en-AU',
      ...args.display,
      card: {
        title: 'Card title',
        logo: {
          image: fakeJpegDataURL(),
          ...args.display?.card?.logo,
        },
        ...args.display?.card,
      },
      consent: {
        title: 'Consent title',
        ...args.display?.consent,
      },
      claims: args.display?.claims || [
        { claim: 'claim_one', label: 'Claim 1', type: 'String' },
        { claim: 'claim_two', label: 'Claim 2', type: 'String', value: 'Claim 2' },
      ],
    },
  }
}
