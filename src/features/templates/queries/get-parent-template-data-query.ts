import type { QueryContext } from '../../../cqrs/query-context'
import type { TemplateParentData } from '../../../generated/graphql'
import type { TemplateEntity } from '../entities/template-entity'
import { toTemplateParentData } from '../mapping'

export async function GetParentTemplateDataQuery(this: QueryContext, template: TemplateEntity): Promise<TemplateParentData | null> {
  const parentData = await template.getParentData()
  if (!parentData) return null

  const { parent, parentDisplay } = parentData

  return toTemplateParentData(parent, parentDisplay)
}
