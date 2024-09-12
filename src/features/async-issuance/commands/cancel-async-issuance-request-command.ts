import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { convertAsyncIssuanceExpiryDaysToRequestExpiry } from '../index'

export async function CancelAsyncIssuanceRequestCommand(this: CommandContext, asyncIssuanceRequestId: string) {
  const {
    services: { asyncIssuances },
  } = this

  const request = await this.entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({
    id: asyncIssuanceRequestId,
  })
  if (request.state === 'cancelled') return request

  invariant(request.canCancel, 'Cannot cancel async issuance request')

  await asyncIssuances.deleteAsyncIssuanceIfExists(request.id, convertAsyncIssuanceExpiryDaysToRequestExpiry(request.expiryPeriodInDays))
  request.canceled()
  await this.entityManager.getRepository(AsyncIssuanceEntity).save(request)

  return request
}
