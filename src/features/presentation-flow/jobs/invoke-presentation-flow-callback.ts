import { extractErrorResponseInfo } from '@makerx/node-common'
import { UnrecoverableError } from 'bullmq'
import type { JobHandler } from '../../../background-jobs/jobs'
import { dataSource } from '../../../data'
import type { ActionedPresentationFlowData } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { FindActionedPresentationFlowDataQuery } from '../queries/find-actioned-presentation-flow-data-query'

export type InvokePresentationFlowCallbackJobPayload = { presentationFlowId: string }

export const invokePresentationFlowCallbackJobHandler: JobHandler<InvokePresentationFlowCallbackJobPayload> = async (_context, payload) => {
  const request = await dataSource.getRepository(PresentationFlowEntity).findOneByOrFail({ id: payload.presentationFlowId })

  if (!request.callback) throw new UnrecoverableError('Presentation flow does not have callback input')

  const data = await FindActionedPresentationFlowDataQuery.apply({ entityManager: dataSource.createEntityManager() } as any, [request.id])
  if (!data) throw new UnrecoverableError('Presentation flow is not in a terminal state')

  const callback = request.callback as any

  const requestInit: RequestInit = {
    method: 'POST',
    body: JSON.stringify(data satisfies ActionedPresentationFlowData),
    headers: { ['Content-Type']: 'application/json', ...(callback.headers ?? {}) } as HeadersInit,
  }

  try {
    const response = await fetch(callback.url, requestInit)

    if (response.ok) {
      logger.info('Presentation flow callback complete', {
        presentationFlowId: request.id,
        responseStatus: response.status,
      })
    } else {
      const responseInfo = await extractErrorResponseInfo(response)
      const error = new Error(`Presentation flow callback returned non-200 response: ${response.status}`)
      logger.error(error.message, {
        presentationFlowId: request.id,
        responseInfo,
      })
      throw error
    }
  } catch (error) {
    logger.error(`Presentation flow callback failed`, { presentationFlowId: request.id, error })
    throw error
  }
}
