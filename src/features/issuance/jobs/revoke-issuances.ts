import { In } from 'typeorm'
import type { JobHandler } from '../../../background-jobs/jobs'
import { revokeIssuances } from './revoke-utils'

export type RevokeIssuancesJobPayload = { issuanceIds: string[] }

export const revokeIssuancesJobHandler: JobHandler<RevokeIssuancesJobPayload> = async (context, payload) =>
  revokeIssuances(context, { id: In(payload.issuanceIds) })
