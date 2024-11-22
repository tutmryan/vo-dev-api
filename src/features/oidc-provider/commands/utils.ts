import { invariant } from '../../../util/invariant'
import { apiResourceId, portalClientId } from '../data'

export function systemClientInvariant(clientId: string) {
  invariant(clientId !== portalClientId, 'The portal client cannot be modified')
}

export function systemResourceInvariant(resourceId: string) {
  invariant(resourceId !== apiResourceId, 'The API resource cannot be modified')
}

export function validateUris(type: 'redirect' | 'log out', uris: Array<string | URL>) {
  invariant(uris.length > 0, `At least one ${type} URI is required`)

  uris.forEach((uri) => {
    const protocol = typeof uri === 'string' ? new URL(uri).protocol : uri.protocol
    const isHttps = protocol === 'https:'
    const hostname = typeof uri === 'string' ? new URL(uri).hostname : uri.hostname
    const isLocalhost = hostname === 'localhost'

    if (!isHttps) invariant(isLocalhost, `http: URLs can only be used with localhost`)
  })
}
