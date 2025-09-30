import { identityStoreKeyVaultUrl } from '../config'
import type { ClientSecretService } from './client-secret-service'
import { buildClientSecretService } from './client-secret-service'

export const IDENTITY_STORE_CLIENT_SECRET_NAME = 'identity-store-client-secret'

export function createIdentityStoreSecretService(): ClientSecretService {
  return buildClientSecretService({
    keyVaultUrl: identityStoreKeyVaultUrl,
    name: IDENTITY_STORE_CLIENT_SECRET_NAME,
  })
}
