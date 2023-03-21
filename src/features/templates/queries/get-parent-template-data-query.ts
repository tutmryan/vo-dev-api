import type { QueryContext } from '../../../cqrs/query-context'
import type { TemplateParentData } from '../../../generated/graphql'
import type { TemplateEntity } from '../entities/template-entity'
import { toTemplateParentData } from '../mapping'

export async function GetParentTemplateDataQuery(this: QueryContext, template: TemplateEntity): Promise<TemplateParentData | null> {
  let parent = await template.parent
  if (!parent) return null

  // build list of parents from leaf to root
  const parents = []
  while (parent) {
    parents.push(parent)
    parent = await parent.parent
  }

  const root = parents.pop()!
  const rootDisplay = await root.display

  const ancestors = parents.reverse()
  for (const next of ancestors) {
    root.merge(next)
    rootDisplay.merge(await next.display)
  }

  return toTemplateParentData(root, rootDisplay)
}
