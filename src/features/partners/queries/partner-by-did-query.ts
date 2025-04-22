import type { QueryContext } from '../../../cqs'
import { PartnerEntity } from '../entities/partner-entity'

export async function PartnerByDidQuery(this: QueryContext, did: string) {
  const repo = this.entityManager.getRepository(PartnerEntity)

  const partner = await repo.findOne({
    where: { didHash: PartnerEntity.createDidHash(did) },
    withDeleted: true,
  })

  return partner ?? null
}
