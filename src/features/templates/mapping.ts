import type { TemplateParentData } from '../../generated/graphql'
import type { TemplateDisplayEntity } from './entities/template-display-entity'
import type { TemplateEntity } from './entities/template-entity'

export async function toTemplateParentData(entity: TemplateEntity, display: TemplateDisplayEntity): Promise<TemplateParentData> {
  return {
    isPublic: entity.isPublic,
    validityIntervalInSeconds: entity.validityIntervalInSeconds,
    display,
  }
}
