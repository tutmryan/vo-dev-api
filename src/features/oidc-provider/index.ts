import { OidcStorageService } from '../../services/oidc-storage-service'
import { Lazy } from '../../util/lazy'

export * from './provider'

export const oidcStorageService = Lazy(() => new OidcStorageService())
