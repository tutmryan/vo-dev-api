import { oidcKeyVaultUrl } from '../config'
import type { ClientSecretService } from './client-secret-service'
import { buildClientSecretService } from './client-secret-service'

export const OIDC_CLIENT_SECRET_NAME = 'oidc-client-secret'

export function createOidcSecretService(): ClientSecretService {
  return buildClientSecretService({
    keyVaultUrl: oidcKeyVaultUrl,
    name: OIDC_CLIENT_SECRET_NAME,
  })
}
