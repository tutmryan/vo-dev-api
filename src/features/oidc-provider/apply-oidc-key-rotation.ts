import { logger } from '../../logger'
import { calculateKid } from '../../util/jwk'
import { keys } from './keys'
import { getData, notifyOidcDataChanged } from './provider'

export const applyOidcSigningKeysRotation = async () => {
  const currentKeys = await keys()

  if (currentKeys.length === 0) {
    return // Unlikely to happen that this is a new instance and this job is run before the first key is created
  }

  const providerData = getData()

  // If the keys have changed, notify all providers to reload and reflect the new keys state
  if (currentKeys.length !== providerData.keys.length || calculateKid(currentKeys[0]!) !== calculateKid(providerData.keys[0]!)) {
    logger.info('OIDC keys were changed, notifying all providers to reload')
    notifyOidcDataChanged()
  }
}
