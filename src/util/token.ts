import { createHash } from 'crypto'

export function createKey(token: string, secret?: string) {
  const hash = createHash('sha512')
  // add a secret suffix to make the key more opaque
  // limitedAccessSecret needs only be set in deployed environments
  const keySuffix = secret ?? ''
  hash.update(token + keySuffix)
  return hash.digest('hex')
}
