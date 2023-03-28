import type { QueryContext } from '../../../cqrs/query-context'
import { ContractEntity } from '../entities/contract-entity'

export async function GetContractQuery(this: QueryContext, id: string) {
  return await this.entityManager.getRepository(ContractEntity).findOneOrFail({
    where: { id },
  })
}
