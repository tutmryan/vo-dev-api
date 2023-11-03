import { omit } from 'lodash'
import type { CommandContext } from '../../../cqs'
import type { CreatePartnerInput } from '../../../generated/graphql'
import { PartnerEntity } from '../entities/partner-entity'

export async function CreatePartnerCommand(this: CommandContext, input: CreatePartnerInput) {
  const { entityManager } = this
  const repo = entityManager.getRepository(PartnerEntity)
  const partner = await repo.findOneBy({ did: input.did })

  if (partner) {
    throw new Error('DID already exists in the system. Use updatePartner mutation to update an existing partner.')
  }

  return await repo.save(
    new PartnerEntity({
      tenantId: input.tenantId ?? null,
      issuerId: input.issuerId ?? null,
      linkedDomainUrls: input.linkedDomainUrls ?? null,
      ...omit(input, 'tenantId', 'issuerId', 'linkedDomainUrls'),
    }),
  )
}
