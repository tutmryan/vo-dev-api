import { decode, encode } from 'cbor2'
import { logger } from '../../../../logger'
import { newCacheSection } from '../../../../redis/cache'
import { isPem, pemToDer } from '../../../../util/cryptography'
import { invariant } from '../../../../util/invariant'
import { Lazy } from '../../../../util/lazy'
import { VICAL_TTL } from '../shared-config'
import { parseVical } from './parser'
import type { ParsedVical, VicalProviderConfig } from './types'

function encodeCborForCache(data: any): string {
  return Buffer.from(encode(data)).toString('base64')
}

function decodeCborFromCache<T>(cached: string): T {
  return decode(new Uint8Array(Buffer.from(cached, 'base64'))) as T
}

const vicalCache = Lazy(() => newCacheSection<string>('vical', VICAL_TTL))
const signerCertCache = Lazy(() => newCacheSection<string>('vical-signer', VICAL_TTL))
const trustAnchorCache = Lazy(() => newCacheSection<string>('vical-trust-anchor', VICAL_TTL))

export async function fetchCert(url: string): Promise<Uint8Array> {
  const cacheKey = `${url}-v1`
  const cached = await trustAnchorCache().get(cacheKey)
  if (cached) {
    const decoded = decodeCborFromCache<{ url: string; cert: Uint8Array }>(cached)
    return decoded.cert
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/x-pem-file, application/x-x509-ca-cert, */*',
    },
  })
  invariant(response.ok, `HTTP ${response.status}: ${response.statusText}`)
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const cert = isPem(bytes) ? pemToDer(new TextDecoder().decode(bytes)) : bytes
  await trustAnchorCache().set(cacheKey, encodeCborForCache({ url, cert }))
  return cert
}

async function fetchSignerCertificates(provider: VicalProviderConfig): Promise<Uint8Array[]> {
  const cacheKey = `${provider.id}:signer-v1`
  const cache = signerCertCache()

  // Check cache
  const cached = await cache.get(cacheKey)
  if (cached) {
    return decodeCborFromCache<Uint8Array[]>(cached)
  }

  const responses = new Map<string, Uint8Array>()

  for (const certUrl of provider.signerCertUrls) {
    const response = await fetch(certUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/x-pem-file, application/x-x509-ca-cert, */*',
      },
    })
    invariant(response.ok, `HTTP ${response.status}: ${response.statusText}`)
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    responses.set(certUrl, bytes)
  }

  if (provider.signerCertProcessResponse) {
    const certs = await provider.signerCertProcessResponse(responses)
    await cache.set(cacheKey, encodeCborForCache(certs))
    return certs
  }

  const certs = Array.from(responses.values()).map((bytes) => {
    return isPem(bytes) ? pemToDer(new TextDecoder().decode(bytes)) : bytes
  })

  // Cache the certificate
  await cache.set(cacheKey, encodeCborForCache(certs))

  return certs
}

async function fetchVicalBytes(provider: VicalProviderConfig): Promise<Uint8Array> {
  const response = await fetch(provider.vicalUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/cbor, application/octet-stream, */*',
    },
  })
  invariant(response.ok, `HTTP ${response.status}: ${response.statusText}`)
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  return provider.vicalProcessResponse ? await provider.vicalProcessResponse(bytes) : bytes
}

async function fetchVical(provider: VicalProviderConfig): Promise<ParsedVical> {
  const cacheKey = `${provider.id}:vical-v1`
  const cache = vicalCache()

  const cached = await cache.get(cacheKey)
  if (cached) {
    const decoded = decodeCborFromCache<ParsedVical>(cached)
    if (new Date() < decoded.refreshAt) return decoded
  }

  const signerCerts = await fetchSignerCertificates(provider)
  const vicalBytes = await fetchVicalBytes(provider)
  const parsed = await parseVical(vicalBytes, signerCerts)

  const ttl = parsed.refreshAt.getTime() - Date.now()
  await cache.set(cacheKey, encodeCborForCache(parsed), ttl > 0 ? ttl : VICAL_TTL)
  return parsed
}

export async function fetchMultipleVicals(providers: VicalProviderConfig[]): Promise<ParsedVical[]> {
  const results: ParsedVical[] = []
  for (const provider of providers) {
    try {
      const vical = await fetchVical(provider)
      results.push(vical)
    } catch (e) {
      logger.warn(`Failed to fetch VICAL from provider ${provider.id}`, { error: e })
    }
  }
  return results
}
