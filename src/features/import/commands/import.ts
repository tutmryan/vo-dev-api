import type { CommandContext } from '../../../cqs'
import type { ImportInput } from '../../../generated/graphql'
import { CreateContractCommand } from '../../contracts/commands/create-contract-command'
import { CreateTemplateCommand } from '../../templates/commands/create-template-command'

export async function ImportCommand(this: CommandContext, input: ImportInput): Promise<void> {
  const templateIdMap = new Map<string, string>()
  const templates = input.templates ?? []
  const contracts = input.contracts ?? []

  for (const { id: originalId, templateInput } of templates) {
    const newParentId = resolveNewParentId(originalId, templateInput.parentTemplateId, templates, templateIdMap)

    const created = await CreateTemplateCommand.call(this, {
      ...templateInput,
      parentTemplateId: newParentId,
    })
    templateIdMap.set(originalId, created.id)
  }

  for (const { contractInput } of contracts) {
    const newTemplateId = contractInput.templateId ? templateIdMap.get(contractInput.templateId) : undefined

    await CreateContractCommand.call(this, {
      ...contractInput,
      templateId: newTemplateId,
    })
  }
}

function resolveNewParentId(
  originalId: string,
  parentId: string | null | undefined,
  templates: Array<{ id: string }>,
  templateIdMap: Map<string, string>,
): string | undefined {
  if (!parentId) return
  if (!templateIdMap.has(parentId)) {
    const parentIsLater = templates.some((t) => t.id === parentId)
    if (parentIsLater) {
      throw new Error(`Invalid import order: template "${originalId}" depends on "${parentId}", which must come earlier.`)
    }
    throw new Error(`Missing parent: template "${originalId}" depends on "${parentId}", which was not included.`)
  }

  return templateIdMap.get(parentId)
}
