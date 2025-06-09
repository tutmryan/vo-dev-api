import type { JobHandler } from '../../../background-jobs/jobs'
import { applyOidcSigningKeysRotation } from '../apply-oidc-key-rotation'

export const applyOidcSigningKeysRotationJobHandler: JobHandler = async () => applyOidcSigningKeysRotation()
