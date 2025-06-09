import { subHours } from 'date-fns'
import type { JWK } from 'jose'
import { oidcStorageService } from '.'
import { runDeduplicatedJob } from '../../background-jobs'
import { invariant } from '../../util/invariant'

export const oidcKeyHoursBeforeUsage = 24

/***
 * Safely loads OIDC provider keys, performing initialization if necessary, by running and awaiting a deduplicated background job.
 */
export async function keys(): Promise<JWK[]> {
  const existing = await oidcStorageService().loadExistingKeys()

  if (existing) {
    // Key usage cut-off date
    const cutOff = subHours(new Date(), oidcKeyHoursBeforeUsage)
    let keys = [...existing]
    // Move the most recent key to the end of the list if it was created less than `oidcKeyHoursBeforeUsage` hours ago
    if (keys[0] && keys[0].createdOn > cutOff) {
      const [mostRecent, ...rest] = keys
      keys = [...rest, mostRecent]
    }
    return keys.map((k) => k.jwk)
  }

  // key initialization must be run in a deduplicated job to prevent concurrent initialization attempts from multiple instances
  await runDeduplicatedJob('initialiseOidcKeys', {}, true)
  const keys = await oidcStorageService().loadExistingKeys()
  invariant(keys, 'OIDC keys were not initialized')
  return keys.map((k) => k.jwk)
}
