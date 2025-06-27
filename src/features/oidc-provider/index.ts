import { randomBytes } from 'crypto'
import { createOidcSecretService } from '../../services/oidc-secret-service'
import { OidcStorageService } from '../../services/oidc-storage-service'
import { Lazy } from '../../util/lazy'

export * from './provider'

export const oidcStorageService = Lazy(() => new OidcStorageService())
export const oidcSecretService = Lazy(() => createOidcSecretService())

export async function generateOidcClientSecret(): Promise<string> {
  return randomBytes(32).toString('hex')
}
