import type { CommandContext } from '../../../cqs'
import type { CreatePartnerInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { notifyOidcDataChanged } from '../../oidc-provider'
import { PartnerEntity } from '../entities/partner-entity'

export async function CreatePartnerCommand(this: CommandContext, input: CreatePartnerInput) {
  const { entityManager } = this
  const repo = entityManager.getRepository(PartnerEntity)

  const partner = await repo.findOne({
    where: { did: input.did },
    withDeleted: true,
  })
  invariant(!partner, 'DID already exists in the system. Use updatePartner mutation to update an existing partner.')

  type AdvancedInitKeys = 'tenantId' | 'issuerId' | 'linkedDomainUrls'
  type RemainingKeys = Omit<CreatePartnerInput, AdvancedInitKeys>

  const { tenantId, issuerId, linkedDomainUrls, ...rest } = input as {
    [K in keyof CreatePartnerInput]: K extends AdvancedInitKeys ? CreatePartnerInput[K] : never
  } & RemainingKeys

  const result = await repo.save(
    new PartnerEntity({
      tenantId: tenantId ?? null,
      issuerId: issuerId ?? null,
      linkedDomainUrls: linkedDomainUrls ?? null,
      ...rest,
    }),
  )
  notifyOidcDataChanged()
  return result
}
