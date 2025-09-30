import { createIdentityStoreSecretService } from '../../services/identity-store-secret-service'
import { Lazy } from '../../util/lazy'

export const identityStoreSecretService = Lazy(() => createIdentityStoreSecretService())
