import type { CommandContext } from '../../../cqrs/command-context'
import type { TemplateInput } from '../../../generated/graphql'
import { TemplateDisplayClaimEntity } from '../entities/template-display-claim-entity'
import { TemplateDisplayConsentEntity } from '../entities/template-display-consent-entity'
import { TemplateDisplayCredentialEntity } from '../entities/template-display-credential-entity'
import { TemplateDisplayCredentialLogoEntity } from '../entities/template-display-credential-logo-entity'
import { TemplateDisplayEntity } from '../entities/template-display-entity'
import { TemplateEntity } from '../entities/template-entity'

export async function CreateTemplateCommand(this: CommandContext, input: TemplateInput) {
  const repository = this.entityManager.getRepository(TemplateEntity)

  const parent = input.parentTemplateID ? await repository.findOneByOrFail({ id: input.parentTemplateID }) : null

  const template = new TemplateEntity({
    name: input.name,
    description: input.description,
    isPublic: input.isPublic ?? null,
    validityIntervalInSeconds: input.validityIntervalInSeconds ?? null,
    parent,
    display: new TemplateDisplayEntity({
      locale: input.display.locale ?? null,
      consent: new TemplateDisplayConsentEntity({
        title: input.display.consent.title ?? null,
        instructions: input.display.consent.instructions ?? null,
      }),
      card: new TemplateDisplayCredentialEntity({
        title: input.display.card.title ?? null,
        description: input.display.card.description ?? null,
        backgroundColor: input.display.card.backgroundColor ?? null,
        textColor: input.display.card.textColor ?? null,
        issuedBy: input.display.card.issuedBy ?? null,
        logo: new TemplateDisplayCredentialLogoEntity({
          description: input.display.card.logo.description || null,
          uri: input.display.card.logo.uri || null,
          image: input.display.card.logo.image || null,
        }),
      }),
      claims: input.display.claims.map(
        (x) =>
          new TemplateDisplayClaimEntity({
            type: x.type,
            claim: x.claim,
            label: x.label,
            description: x.description ?? null,
            value: x.value ?? null,
          }),
      ),
    }),
  })

  const checkParentOverridesResult = await template.checkParentOverrides()
  if (checkParentOverridesResult.result === 'failure') {
    throw new Error(`The template overrides the following properties from its parent: ${checkParentOverridesResult.errors.join(', ')}`)
  }

  return await repository.save(template)
}
