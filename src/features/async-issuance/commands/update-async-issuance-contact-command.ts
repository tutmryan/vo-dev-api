import type { CommandContext } from '../../../cqs'
import type { AsyncIssuanceContactInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { validNotificationStatuses } from '../notification'

export async function UpdateAsyncIssuanceContactCommand(
  this: CommandContext,
  asyncIssuanceRequestId: string,
  input: AsyncIssuanceContactInput,
) {
  const entity = await this.entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  invariant(validNotificationStatuses.includes(entity.status), 'Invalid status for updating contact')

  const asyncIssuance = await this.services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, entity.expiry)
  invariant(asyncIssuance, 'Async issuance data not found')

  asyncIssuance.contact = input
  await this.services.asyncIssuances.uploadAsyncIssuance(asyncIssuanceRequestId, asyncIssuance)

  return input
}
