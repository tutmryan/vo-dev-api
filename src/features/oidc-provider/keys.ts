import type { JWK } from 'jose'
import { oidcStorageService } from '.'
import { runDeduplicatedJob } from '../../background-jobs'
import { invariant } from '../../util/invariant'

/***
 * Safely loads OIDC provider keys, performing initialization if necessary, by running and awaiting a deduplicated background job.
 */
export async function keys(): Promise<JWK[]> {
  const existing = await oidcStorageService().loadExistingKeys()
  if (existing) return existing
  // key initialization must be run in a deduplicated job to prevent concurrent initialization attempts from multiple instances
  await runDeduplicatedJob({ name: 'initializeOidcKeys', payload: undefined }, true)
  const keys = await oidcStorageService().loadExistingKeys()
  invariant(keys, 'OIDC keys were not initialized')
  return keys
}
