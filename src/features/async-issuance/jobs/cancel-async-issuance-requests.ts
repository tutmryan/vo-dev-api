import { type FindOptionsWhere, In } from 'typeorm'
import { AuditEvents } from '../../../audit-types'
import type { HandlerContext, JobHandler } from '../../../background-jobs/jobs'
import { dataSource, transactionOrReuse } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { convertAsyncIssuanceExpiryDaysToRequestExpiry } from '../index'

export type CancelAsyncIssuanceRequestsJobPayload = { asyncIssuanceRequestIds: string[] }

export const cancelAsyncIssuanceRequestsHandler: JobHandler<CancelAsyncIssuanceRequestsJobPayload> = async (context, payload) =>
  cancelAsyncIssuanceRequests(context, { id: In(payload.asyncIssuanceRequestIds) })

const cancelAsyncIssuanceRequests = async (context: HandlerContext, where: FindOptionsWhere<AsyncIssuanceEntity>) => {
  const errorMessages = []
  const {
    logger,
    user,
    services: { asyncIssuances },
  } = context
  invariant(user, 'User is required in worker context for cancelling async issuances')
  const requests = await dataSource.getRepository(AsyncIssuanceEntity).find({ where })

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]!
    logger.mergeMeta({
      asyncIssuanceRequestId: request.id,
    })
    try {
      if (request.state === 'cancelled') {
        continue
      }
      if (!request.canCancel) {
        errorMessages.push(`Cannot cancel the async issuance request ${request.id} because its status is final`)
        continue
      }

      await transactionOrReuse(async (entityManager) => {
        addUserToManager(entityManager, user.id)
        await asyncIssuances.deleteAsyncIssuanceIfExists(
          request.id,
          convertAsyncIssuanceExpiryDaysToRequestExpiry(request.expiryPeriodInDays),
        )
        request.canceled()
        await entityManager.getRepository(AsyncIssuanceEntity).save(request)
        logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_REQUEST_CANCELLED_JOB)
      })
    } catch (err) {
      logger.error(`Error occurred when canceling the async issuance request ${request.id}`, err)
      logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_CANCELLATION_FAILED)
      errorMessages.push(`Error occurred when canceling the async issuance request ${request.id}: ${(err as Error).message}`)
    } finally {
      await context.updateProgress(Math.floor(((i + 1) / requests.length) * 100))
    }
  }

  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'))
  }
}
