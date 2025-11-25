import type { CommandContext } from '../../../cqs'
import type { AsyncIssuanceContactInput, Maybe } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

export async function UpdateAsyncIssuanceContactCommand(
  this: CommandContext,
  asyncIssuanceRequestId: string,
  input?: Maybe<AsyncIssuanceContactInput>,
) {
  this.logger.mergeMeta({
    asyncIssuanceRequestId,
  })
  const asyncIssuanceRepository = await this.entityManager.getRepository(AsyncIssuanceEntity)
  const asyncIssuance = await asyncIssuanceRepository.findOneByOrFail({ id: asyncIssuanceRequestId })
  invariant(!asyncIssuance.isStatusFinal, 'Invalid status for updating contact')

  const asyncIssuanceRequest = await this.services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, asyncIssuance.expiry)
  invariant(asyncIssuanceRequest, 'Async issuance data not found')

  asyncIssuanceRequest.contact = input
  await this.services.asyncIssuances.uploadAsyncIssuance(asyncIssuanceRequestId, asyncIssuanceRequest)

  this.logger.audit('Async issuance contact updated')

  asyncIssuance.contactUpdated()
  await asyncIssuanceRepository.save(asyncIssuance)

  return input ?? null
}
