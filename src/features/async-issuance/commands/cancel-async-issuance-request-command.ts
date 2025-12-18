import { AuditEvents } from '../../../audit-types'
import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { convertAsyncIssuanceExpiryDaysToRequestExpiry } from '../index'

export const cannotCancelError = 'Cannot cancel async issuance request'

export async function CancelAsyncIssuanceRequestCommand(this: CommandContext, asyncIssuanceRequestId: string) {
  const {
    services: { asyncIssuances },
    logger,
  } = this

  logger.mergeMeta({
    asyncIssuanceRequestId,
  })

  const request = await this.entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({
    id: asyncIssuanceRequestId,
  })
  if (request.state === 'cancelled') return request

  invariant(request.canCancel, cannotCancelError)

  await asyncIssuances.deleteAsyncIssuanceIfExists(request.id, convertAsyncIssuanceExpiryDaysToRequestExpiry(request.expiryPeriodInDays))
  request.canceled()
  await this.entityManager.getRepository(AsyncIssuanceEntity).save(request)

  logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_REQUEST_CANCELLED_COMMAND)

  return request
}
