import { createHash } from 'crypto'
import { limitedAccess } from '../config'

export function createKey(token: string) {
  const hash = createHash('sha512')
  // add a secret suffix to make the key more opaque
  // limitedAccessSecret needs only be set in deployed environments
  const keySuffix = limitedAccess.secret ?? ''
  hash.update(token + keySuffix)
  return hash.digest('hex')
}
