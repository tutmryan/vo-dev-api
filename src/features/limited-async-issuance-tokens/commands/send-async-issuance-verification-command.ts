import { codeExpiryMinutes, setVerificationCode } from '..'
import { newCacheSection } from '../../../cache'
import type { CommandContext } from '../../../cqs'
import type { SendAsyncIssuanceVerificationResponse } from '../../../generated/graphql'
import { AsyncIssuanceRequestStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { randomDigits } from '../../../util/random-digits'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'

const verificationThrottleSeconds = 120 - 1 // 2 minutes - 1 second for buffer
const verificationThrottleCache = newCacheSection('verificationThrottle')

const canIssueStatuses = [AsyncIssuanceRequestStatus.Pending, AsyncIssuanceRequestStatus.Failed]

export async function SendAsyncIssuanceVerificationCommand(
  this: CommandContext,
  asyncIssuanceRequestId: string,
): Promise<SendAsyncIssuanceVerificationResponse> {
  const {
    entityManager,
    services: { asyncIssuances, communications },
  } = this

  // validate async issuance entity
  const entity = await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  invariant(canIssueStatuses.includes(entity.status), `Invalid async issuance status for verification: ${entity.status}`)

  // load async issuance data
  const asyncIssuanceRequest = await asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, entity.expiry)
  invariant(asyncIssuanceRequest, 'Failed to download async issuance details')
  const verification = asyncIssuanceRequest.contact.verification ?? asyncIssuanceRequest.contact.notification

  // throttle subsequent verification, if necessary
  const throttleKey = `asyncIssuanceVerification:${entity.identityId}`
  const shouldThrottle = await verificationThrottleCache.get(throttleKey)
  if (shouldThrottle) {
    this.logger.warn(`Throttling verification for async issuance: ${entity.id}`)
    return { method: verification.method }
  }

  // generate a code
  const verificationCode = randomDigits(6)
  await setVerificationCode(asyncIssuanceRequestId, verificationCode)

  // send verification
  await communications.sendVerification(
    verification.value,
    {
      verificationCode,
      codeExpiryMinutes,
      contactMethod: verification.method,
      recipientId: entity.identityId,
      createdById: entity.createdById,
      asyncIssuanceId: entity.id,
    },
    entityManager,
  )

  // set throttle entry
  await verificationThrottleCache.set(throttleKey, true.toString(), { ttl: verificationThrottleSeconds })

  return { method: verification.method }
}
