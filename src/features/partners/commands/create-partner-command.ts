import { omit } from 'lodash'
import type { CommandContext } from '../../../cqs'
import type { CreatePartnerInput } from '../../../generated/graphql'
import { notifyOidcDataChanged } from '../../oidc-provider'
import { PartnerEntity } from '../entities/partner-entity'

export async function CreatePartnerCommand(this: CommandContext, input: CreatePartnerInput) {
  const { entityManager } = this
  const repo = entityManager.getRepository(PartnerEntity)

  const sharedProps = {
    tenantId: input.tenantId ?? null,
    issuerId: input.issuerId ?? null,
    linkedDomainUrls: input.linkedDomainUrls ?? null,
    ...omit(input, 'tenantId', 'issuerId', 'linkedDomainUrls'),
  }

  const partner = await repo.findOne({
    where: { did: input.did },
    withDeleted: true,
  })

  if (partner) {
    if (partner.deletedAt) {
      repo.merge(partner, {
        ...sharedProps,
        deletedAt: null,
      })
      return await repo.save(partner)
    } else {
      throw new Error('DID already exists in the system. Use updatePartner mutation to update an existing partner.')
    }
  }

  const saved = await repo.save(new PartnerEntity(sharedProps))
  notifyOidcDataChanged()
  return saved
}
