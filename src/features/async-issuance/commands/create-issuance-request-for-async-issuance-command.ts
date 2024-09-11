import { type TransactionalCommandContext } from '../../../cqs'
import { type IssuanceRequestResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { CreateIssuanceRequestCommand } from '../../issuance/commands/create-issuance-request-command'
import { getLimitedAsyncIssuanceKey, setLimitedAsyncIssuanceData } from '../../limited-async-issuance-tokens'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

export async function CreateIssuanceRequestForAsyncIssuanceCommand(
  this: TransactionalCommandContext,
  asyncIssuanceRequestId: string,
): Promise<IssuanceRequestResponse> {
  const { services, user, inTransaction } = this

  invariant(user?.limitedAsyncIssuanceData, 'User has no async issuance data')
  invariant(user.limitedAsyncIssuanceData.asyncIssuanceRequestId === asyncIssuanceRequestId, 'Invalid async issuance request id')

  // TypeScript does not carry the inferred/narrowed types in a closure. So this a little workaround till such time it does or the AI overlords take over. Either way, this is a temporary workaround.
  const { limitedAsyncIssuanceData } = user

  const asyncIssuanceEntity = await inTransaction(async (entityManager) => {
    return await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  })

  invariant(!asyncIssuanceEntity.isStatusFinal, 'Invalid status for issuance')

  try {
    return await this.inTransaction(async (entityManager) => {
      const asyncIssuance = await services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, asyncIssuanceEntity.expiry)
      invariant(asyncIssuance, 'Async issuance request data not found')

      const asyncIssuanceKey = getLimitedAsyncIssuanceKey(user!.token)
      const response = await CreateIssuanceRequestCommand.apply({ ...this, entityManager }, [
        {
          ...asyncIssuance,
          includeQRCode: true,
          photoCaptureRequestId: limitedAsyncIssuanceData.photoCaptureRequestId,
          asyncIssuanceKey,
        },
      ])

      // if the response is RequestErrorResponse, return it immediately
      if ('error' in response) {
        asyncIssuanceEntity.failed('issuance-failed')
        await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)
        return response
      }

      // persist the issuance request id for subsequent retrieval
      if ('requestId' in response) {
        limitedAsyncIssuanceData.issuanceRequestId = response.requestId
        await setLimitedAsyncIssuanceData(user.token, limitedAsyncIssuanceData)
      }

      return response
    })
  } catch (error) {
    await this.inTransaction(async (entityManager) => {
      asyncIssuanceEntity.failed('issuance-verification-failed')
      await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)
    })
    throw error
  }
}
