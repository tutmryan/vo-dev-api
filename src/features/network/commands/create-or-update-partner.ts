import { isEqual, omit } from 'lodash'
import type { CommandContext } from '../../../cqrs/command-context'
import type { PartnerInput } from '../../../generated/graphql'
import { PartnerEntity } from '../entities/partner-entity'

export async function CreateOrUpdatePartnerCommand(this: CommandContext, input: PartnerInput) {
  const { entityManager } = this
  const repo = entityManager.getRepository(PartnerEntity)
  const partner = await repo.findOneBy({ did: input.did })

  if (partner) {
    let isUpdated = false
    if (partner.name !== input.name) {
      partner.name = input.name
      isUpdated = true
    }
    if (!isEqual(partner.credentialTypes.sort(), input.credentialTypes.sort())) {
      partner.credentialTypes = input.credentialTypes
      isUpdated = true
    }
    if (!isEqual(partner.tenantId, input.tenantId ?? null)) {
      partner.tenantId = input.tenantId ?? null
      isUpdated = true
    }
    if (!isEqual(partner.issuerId, input.issuerId ?? null)) {
      partner.issuerId = input.issuerId ?? null
      isUpdated = true
    }
    if (!isEqual(partner.linkedDomainUrls?.sort(), input.linkedDomainUrls?.sort())) {
      partner.linkedDomainUrls = input.linkedDomainUrls ?? null
      isUpdated = true
    }

    return isUpdated ? await repo.save(partner) : partner
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
