import type { JobHandler } from '../../../background-jobs/jobs'
import { homeTenant } from '../../../config'
import { createIdentityStoreSecretService } from '../../../services/identity-store-secret-service'
import { notifyIdentityStoreChanged } from '../../instance-configs'

function normalize(s?: string | null) {
  const v = (s ?? '').trim()
  return v.length ? v : undefined
}

function isNotFound(err: unknown): boolean {
  if (!err) return false
  const e = err as any

  if (typeof e.statusCode === 'number' && e.statusCode === 404) return true
  if (typeof e.status === 'number' && e.status === 404) return true

  const code = String(e.code ?? '').toLowerCase()
  const name = String(e.name ?? '').toLowerCase()
  if (code.includes('notfound') || code === '404') return true
  if (name.includes('notfound')) return true

  const msg = String(e.message ?? '').toLowerCase()
  if (msg.includes('not found') || msg.includes('does not exist') || msg.includes('could not be found')) return true

  return false
}
/**
 * Migration policy:
 * - create only if the secret is missing
 * - no-op if the secret exists
 * - skip if clientId/clientSecret absent in config
 */
export const migrateHomeTenantGraphClientSecretsHandler: JobHandler = async (context) => {
  const { logger } = context

  const clientId = normalize(homeTenant.graphCredentials?.clientId)
  const clientSecret = normalize(homeTenant.graphCredentials?.clientSecret)

  if (!clientId && !clientSecret) {
    logger.info('[migrateHomeTenantGraphClientSecrets] no home-tenant graph credentials in config; skipping')
    return
  }
  if (!clientId) {
    logger.warn('[migrateHomeTenantGraphClientSecrets] clientId missing in config; cannot check/create secret')
    return
  }
  if (!clientSecret) {
    logger.warn('[migrateHomeTenantGraphClientSecrets] clientSecret missing in config; nothing to create')
    return
  }

  const secretService = createIdentityStoreSecretService()

  try {
    await secretService.get(clientId)
    logger.info('[migrateHomeTenantGraphClientSecrets] secret already exists; no-op', { clientId })
    return
  } catch (getErr) {
    if (isNotFound(getErr)) {
      try {
        await secretService.set(clientId, clientSecret)
        notifyIdentityStoreChanged()
        logger.info('[migrateHomeTenantGraphClientSecrets] created missing Key Vault secret from config value', {
          clientId,
        })
        return
      } catch (setErr) {
        logger.error('[migrateHomeTenantGraphClientSecrets] failed to create Key Vault secret', {
          clientId,
          error: setErr,
        })
        throw setErr
      }
    }
    logger.error('[migrateHomeTenantGraphClientSecrets] failed to read Key Vault secret', {
      clientId,
      error: getErr,
    })
    throw getErr
  }
}
