import { newCacheSection } from '../../../redis/cache'
import { Lazy } from '../../../util/lazy'
import type { EphemeralKeyData, MDocRequestDetails } from './types'

export const MDOC_TTL = 1000 * 60 * 15 // 15 minutes

export const mdocEphemeralKeys = Lazy(() => newCacheSection<EphemeralKeyData>('mdocEphemeralKeys', MDOC_TTL))

export const mdocRequestDetailsCache = Lazy(() => newCacheSection<MDocRequestDetails>('mdocRequestDetails', MDOC_TTL))

export const VICAL_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
