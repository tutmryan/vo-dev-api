import { graphql } from '../../../generated'
import { executeOperationAsCredentialAdmin } from '../../../test'

const getTemplateQuery = graphql(
  `
  query GetTemplate($id: ID!) {
    template(id: $id) {
      ...TemplateFragment
    }
  }` as const,
)

export async function getTemplate(id: string) {
  const { data, errors } = await executeOperationAsCredentialAdmin({
    query: getTemplateQuery,
    variables: { id },
  })

  if (errors) {
    throw new Error(`Error while getting the template: ${JSON.stringify(errors)}`)
  }

  return data!.template
}
