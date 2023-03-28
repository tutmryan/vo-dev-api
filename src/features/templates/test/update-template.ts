import { graphql } from '../../../generated'
import type { TemplateFragmentFragment, TemplateInput } from '../../../generated/graphql'
import { omit } from 'lodash'

export const updateTemplateMutation = graphql(
  `
  mutation UpdateTemplate($id: ID!, $input: TemplateInput!) {
    updateTemplate(id: $id, input: $input) {
      ...TemplateFragment
    }
  }
` as const,
)

export function getUpdateTemplateInput(template: TemplateFragmentFragment): TemplateInput {
  return omit(template, 'id', 'parent')
}
