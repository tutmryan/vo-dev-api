import type { CommandContext } from '../../../cqs'
import { logger } from '../../../logger'
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
  invariant(request.status !== 'issued', 'Issuance request has been issued')

  if (request.state === 'cancelled') return request

  await asyncIssuances.deleteAsyncIssuanceIfExists(request.id, convertAsyncIssuanceExpiryDaysToRequestExpiry(request.expiryPeriodInDays))
  request.canceled()
  await this.entityManager.getRepository(AsyncIssuanceEntity).save(request)

  logger.audit('Async issuance request canceled', { asyncIssuanceRequest: request })
  return request
}
