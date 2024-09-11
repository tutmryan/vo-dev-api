import { type CommandContext, type MultiTransactionalCommandContext } from '../../../cqs'
import { type IssuanceRequestResponse } from '../../../generated/graphql'
import type { User } from '../../../user'
import { invariant } from '../../../util/invariant'
import { CreateIssuanceRequestCommand } from '../../issuance/commands/create-issuance-request-command'
import { getLimitedAsyncIssuanceKey, setLimitedAsyncIssuanceData } from '../../limited-async-issuance-tokens'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { validNotificationStatuses } from '../notification'

export async function CreateIssuanceRequestForAsyncIssuanceCommand(
  this: MultiTransactionalCommandContext,
  asyncIssuanceRequestId: string,
): Promise<IssuanceRequestResponse> {
  let entity: AsyncIssuanceEntity
  let vettedUser: Pick<User, 'userEntity' | 'token'> & Required<Pick<User, 'limitedAsyncIssuanceData'>>

  await this.runInTransaction(async (context: CommandContext) => {
    const { user, entityManager } = context
    invariant(user?.limitedAsyncIssuanceData, 'User has no async issuance data')
    invariant(user.limitedAsyncIssuanceData.asyncIssuanceRequestId === asyncIssuanceRequestId, 'Invalid async issuance request id')
    vettedUser = {
      ...user,
      limitedAsyncIssuanceData: user.limitedAsyncIssuanceData,
    }

    entity = await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
    invariant(validNotificationStatuses.includes(entity.status), 'Invalid status for issuance')
  })

  try {
    return await this.runInTransaction(async (context: CommandContext) => {
      const { services, entityManager, user } = context

      const asyncIssuance = await services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, entity.expiry)
      invariant(asyncIssuance, 'Async issuance request data not found')

      const asyncIssuanceKey = getLimitedAsyncIssuanceKey(user!.token)
      const response = await CreateIssuanceRequestCommand.apply(context, [
        {
          ...asyncIssuance,
          includeQRCode: true,
          photoCaptureRequestId: user!.limitedAsyncIssuanceData!.photoCaptureRequestId,
          asyncIssuanceKey,
        },
      ])

      // if the response is RequestErrorResponse, return it immediately
      if ('error' in response) {
        entity.failed('issuance-failed')
        await entityManager.getRepository(AsyncIssuanceEntity).save(entity)
        return response
      }

      // persist the issuance request id for subsequent retrieval
      if ('requestId' in response) {
        vettedUser.limitedAsyncIssuanceData.issuanceRequestId = response.requestId
        await setLimitedAsyncIssuanceData(vettedUser.token, vettedUser.limitedAsyncIssuanceData)
      }

      return response
    })
  } catch (error) {
    await this.runInTransaction(async (context: CommandContext) => {
      entity.failed('issuance-failed')
      await context.entityManager.getRepository(AsyncIssuanceEntity).save(entity)
    })
    throw error
  }
}
