import type { JobHandler } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { applyOidcSigningKeysRotation } from '../apply-oidc-key-rotation'

export type ApplyOidcSigningKeysRotationJobName = 'applyOidcSigningKeysRotation'
export type ApplyOidcSigningKeysRotationJobId = ApplyOidcSigningKeysRotationJobName
export type ApplyOidcSigningKeysRotationJobPayload = undefined
export type ApplyOidcSigningKeysRotationJobType = JobType<ApplyOidcSigningKeysRotationJobName, ApplyOidcSigningKeysRotationJobPayload>

export const applyOidcSigningKeysRotationJobHandler: JobHandler<ApplyOidcSigningKeysRotationJobPayload> = async (_context, _job) =>
  applyOidcSigningKeysRotation()
