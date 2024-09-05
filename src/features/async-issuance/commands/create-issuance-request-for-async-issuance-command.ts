import { type CommandContext } from '../../../cqs'
import { type IssuanceRequestResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { CreateIssuanceRequestCommand } from '../../issuance/commands/create-issuance-request-command'
import { getLimitedAsyncIssuanceKey, setLimitedAsyncIssuanceData } from '../../limited-async-issuance-tokens'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { validNotificationStatuses } from '../notification'

export async function CreateIssuanceRequestForAsyncIssuanceCommand(
  this: CommandContext,
  asyncIssuanceRequestId: string,
): Promise<IssuanceRequestResponse> {
  const { user, entityManager, services } = this

  invariant(user?.limitedAsyncIssuanceData, 'User has no async issuance data')
  invariant(user.limitedAsyncIssuanceData.asyncIssuanceRequestId === asyncIssuanceRequestId, 'Invalid async issuance request id')

  const entity = await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  invariant(validNotificationStatuses.includes(entity.status), 'Invalid status for issuance')

  const asyncIssuance = await services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, entity.expiry)
  invariant(asyncIssuance, 'Async issuance request data not found')

  const asyncIssuanceKey = getLimitedAsyncIssuanceKey(user.token)

  const response = await CreateIssuanceRequestCommand.apply(this, [
    { ...asyncIssuance, includeQRCode: true, photoCaptureRequestId: user.limitedAsyncIssuanceData.photoCaptureRequestId, asyncIssuanceKey },
  ])

  // if the response is RequestErrorResponse, return it immediately
  if ('error' in response) return response

  // persist the issuance request id for subsequent retrieval
  if ('requestId' in response) {
    user.limitedAsyncIssuanceData.issuanceRequestId = response.requestId
    await setLimitedAsyncIssuanceData(user.token, user.limitedAsyncIssuanceData)
  }

  return response
}
