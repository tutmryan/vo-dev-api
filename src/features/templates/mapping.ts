import type { TemplateParentData } from '../../generated/graphql'
import type { TemplateEntity } from './entities/template-entity'
import type { TemplateDisplayEntity } from './entities/template-display-entity'

export async function toTemplateParentData(entity: TemplateEntity, display: TemplateDisplayEntity): Promise<TemplateParentData> {
  return {
    isPublic: entity.isPublic,
    validityIntervalInSeconds: entity.validityIntervalInSeconds,
    display: {
      card: {
        ...display.card,
        logo: display.card?.logo ?? {},
      },
      claims: display.claims ?? [],
      consent: display.consent ?? {},
      locale: display.locale,
    },
  }
}
