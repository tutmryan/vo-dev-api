import { Buffer } from 'buffer'
import type { JWK, KeyLike } from 'jose'
import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose'
import { resolveDidWebDocument } from './did-web-resolver'

interface VerificationMethod {
  id: string
  type: string
  controller: string
  publicKeyJwk?: JWK
}

interface DidDocument {
  verificationMethod?: VerificationMethod[]
}

interface DidResolutionResult {
  publicKey: KeyLike | Uint8Array
  verificationAlgorithm: string
}

/**
 * The issuer (`iss`) claim used by Microsoft Authenticator and other SIOP v2-compliant wallets
 * when issuing self-issued verifiable presentations.
 *
 * See:
 * - https://openid.net/specs/openid-connect-self-issued-v2-1_0.html
 */
export const SIOP_V2_ISSUER = 'https://self-issued.me/v2/openid-vc'

export async function verifyDidJwt(
  token: string,
  opts: {
    presentedAt: Date
    audience?: string
    issuer: string
  },
): Promise<void> {
  const { kid, alg } = decodeProtectedHeader(token)
  if (!kid) throw new Error('JWT is missing "kid" in its header')
  if (!alg) throw new Error('JWT is missing "alg" in its header')

  // 1. Resolve the public key and algorithm using the modular resolver.
  const { publicKey, verificationAlgorithm } = await resolveDidPublicKey(kid, alg)

  // 2. Verify the JWT signature and claims.
  await jwtVerify(token, publicKey, {
    algorithms: [verificationAlgorithm],
    issuer: opts.issuer,
    currentDate: opts.presentedAt,
    audience: opts.audience,
  })
}

// --- Router - DID Public Key Resolver ---
async function resolveDidPublicKey(kid: string, originalAlg: string): Promise<DidResolutionResult> {
  if (kid.startsWith('did:jwk:')) {
    return resolveDidJwk(kid, originalAlg)
  }
  if (kid.startsWith('did:web:')) {
    return resolveDidWeb(kid, originalAlg)
  }
  if (kid.startsWith('did:ion:')) {
    return resolveDidIon(kid)
  }
  throw new Error(`Unsupported DID method in kid: ${kid}`)
}

// --- Resolver for did:jwk ---
async function resolveDidJwk(kid: string, alg: string): Promise<DidResolutionResult> {
  const [didJwk] = kid.split('#')
  if (!didJwk) throw new Error(`Malformed kid, missing base did:jwk segment: ${kid}`)

  const jwkEncoded = didJwk.replace('did:jwk:', '')
  const jwkJson = Buffer.from(jwkEncoded, 'base64url').toString()
  const jwk = JSON.parse(jwkJson) as JWK

  const publicKey = await importJWK(jwk, alg)
  return { publicKey, verificationAlgorithm: alg }
}

// --- Resolver for did:web ---
async function resolveDidWeb(kid: string, alg: string): Promise<DidResolutionResult> {
  const [did, keyFragment] = kid.split('#')
  if (!did) throw new Error(`Malformed kid, missing did:web segment: ${kid}`)
  if (!keyFragment) throw new Error(`Malformed kid, missing key fragment: ${kid}`)

  const didDoc: DidDocument = await resolveDidWebDocument(did)
  const vms = didDoc.verificationMethod
  if (!Array.isArray(vms)) throw new Error('No verificationMethod array found in DID document')

  const signingKey = vms.find((vm) => vm.id.endsWith(`#${keyFragment}`))
  if (!signingKey?.publicKeyJwk) {
    throw new Error(`Signing key "#${keyFragment}" not found or missing publicKeyJwk in DID document for ${did}`)
  }

  const publicKey = await importJWK(signingKey.publicKeyJwk, alg)
  return { publicKey, verificationAlgorithm: alg }
}

// --- Resolver for did:ion ---
async function resolveDidIon(kid: string): Promise<DidResolutionResult> {
  const [didWithSuffix, keyFragment] = kid.split('#')
  if (!didWithSuffix) throw new Error(`Malformed ION DID, could not split suffix: ${kid}`)
  if (!keyFragment) throw new Error(`Malformed ION DID, missing key fragment: ${kid}`)

  const suffix = didWithSuffix.split(':').pop()
  if (!suffix) throw new Error(`Failed to extract suffix from DID: ${didWithSuffix}`)

  let decodedSuffix
  try {
    decodedSuffix = JSON.parse(Buffer.from(suffix, 'base64url').toString())
  } catch (e) {
    throw new Error('Failed to parse ION DID suffix as JSON')
  }

  const patches = decodedSuffix?.delta?.patches
  if (!Array.isArray(patches)) throw new Error('No patches found in ION DID document')

  const publicKeys: VerificationMethod[] = patches.flatMap((patch) => patch.document?.publicKeys || [])
  if (!publicKeys.length) throw new Error('No public keys found in ION DID document patches')

  const signingKey = publicKeys.find((k) => k.id === keyFragment)
  if (!signingKey?.publicKeyJwk) {
    throw new Error(`Signing key "${keyFragment}" not found or missing publicKeyJwk in ION DID`)
  }

  // For ION, the algorithm is often ES256K, which might differ from the JWT header alg.
  // The resolver should be the source of truth for the algorithm.
  const verificationAlgorithm = 'ES256K'
  const publicKey = await importJWK(signingKey.publicKeyJwk, verificationAlgorithm)

  return { publicKey, verificationAlgorithm }
}
