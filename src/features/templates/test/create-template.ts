import { randomUUID } from 'crypto'
import { graphql, useFragment } from '../../../generated'
import type { TemplateInput } from '../../../generated/graphql'
import { executeOperationAsAdmin } from '../../../test'

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
    description: randomUUID(),
  }
}

export async function createTemplate(input: TemplateInput) {
  const { data, errors } = await executeOperationAsAdmin({
    query: createTemplateMutation,
    variables: {
      input,
    },
  })

  if (errors) {
    throw new Error(`Error while creating a template: ${JSON.stringify(errors)}`)
  }

  return useFragment(TemplateFragment, data!.createTemplate)
}
