import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import type { AsyncIssuanceRequestExpiry, AsyncIssuanceRequestInput } from '../../generated/graphql'
import type { AsyncIssuanceService } from '../../services/async-issuance-service'
import { invariant } from '../../util/invariant'
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'

export const asyncIssuanceLoader = () =>
  new DataLoader<string, AsyncIssuanceEntity>(async (ids) => {
    const results = await dataSource.getRepository(AsyncIssuanceEntity).find({ comment: 'FindAsyncIssuancesById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Async issuance not found: ${id}`))
  })

// We can't load multiple at a time but we can deduplicate loading contact data twice when both photoCapture and hasContactNotificationSet are queried on the same record
// We also want to prevent these two fields being queried on multiple records at once as per the field documentation
export const asyncIssuanceContactLoader = (asyncIssuanceService: AsyncIssuanceService) =>
  new DataLoader<{ id: string; expiry: AsyncIssuanceRequestExpiry }, AsyncIssuanceRequestInput | undefined>(async (ids) => {
    const uniqueIds = new Set(ids.map(({ id }) => id))
    invariant(
      uniqueIds.size === 1,
      'Querying the photoCapture or hasContactNotificationSet fields can only be performed on one AsyncIssuanceRequest at a time',
    )
    const { id, expiry } = ids[0]!
    const data = await asyncIssuanceService.downloadAsyncIssuance(id, expiry)
    return ids.map(() => data)
  })
