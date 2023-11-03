import config from '../../../config'
import type { QueryContext } from '../../../cqs'
import { IdentityEntity } from '../entities/identity-entity'

export async function IdentityIssuersQuery(this: QueryContext) {
  const data = await this.entityManager
    .getRepository(IdentityEntity)
    .createQueryBuilder('identity')
    .select('issuer')
    .distinct(true)
    .getRawMany()
  return data.map(
    ({ issuer }) => config.get('identityIssuers')[issuer]?.name ?? issuer, // return the mapped value if configured
  )
}
