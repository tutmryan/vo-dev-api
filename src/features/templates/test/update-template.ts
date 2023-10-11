import { omit } from 'lodash'
import { graphql } from '../../../generated'
import type { TemplateFragmentFragment, TemplateInput } from '../../../generated/graphql'

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
  const input: TemplateInput = omit(template, 'id', 'parent', 'description')
  if (template.parent?.id) input.parentTemplateId = template.parent.id
  return input
}
