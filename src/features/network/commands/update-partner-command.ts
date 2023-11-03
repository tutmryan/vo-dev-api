import { isEqual } from 'lodash'
import type { CommandContext } from '../../../cqs'
import type { UpdatePartnerInput } from '../../../generated/graphql'
import { PartnerEntity } from '../entities/partner-entity'

export async function UpdatePartnerCommand(this: CommandContext, id: string, input: UpdatePartnerInput) {
  const { entityManager } = this
  const repo = entityManager.getRepository(PartnerEntity)
  const partner = await repo.findOneByOrFail({ id })

  let isUpdated = false
  if (partner.name !== input.name) {
    partner.name = input.name
    isUpdated = true
  }
  if (!isEqual(partner.credentialTypes.sort(), input.credentialTypes.sort())) {
    partner.credentialTypes = input.credentialTypes
    isUpdated = true
  }

  return isUpdated ? await repo.save(partner) : partner
}
