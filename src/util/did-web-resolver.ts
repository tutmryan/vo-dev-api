import type { JWK } from 'jose'

interface VerificationMethod {
  id: string
  type: string
  controller: string
  publicKeyJwk: JWK
}

interface DidWebDocument {
  id: string
  verificationMethod: VerificationMethod[]
}

export async function resolveDidWebDocument(didWeb: string): Promise<DidWebDocument> {
  const domain = didWeb.replace(/^did:web:/, '').replace(/:/g, '.')
  const url = `https://${domain}/.well-known/did.json`
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Failed to fetch DID document: ${response.status} ${url}`)
  return response.json()
}
