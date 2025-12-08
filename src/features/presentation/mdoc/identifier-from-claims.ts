import { createHash } from 'crypto'
import { invariant } from '../../../util/invariant'
import type { MDocDocument, MDocRequestClaimPath } from './types'

export function createIdentityIdentifierFromClaims(requestedClaims: MDocRequestClaimPath[], document: MDocDocument): string | null {
  const identityClaims = requestedClaims.filter((claim) => claim.useForIdentity === true)
  invariant(identityClaims.length > 0, 'No claims were marked for identity creation')

  // Sort claims by path for deterministic ordering
  // Path is an array like ["org.iso.18013.5.1", "family_name"]
  const sortedClaims = [...identityClaims].sort((a, b) => {
    const pathA = a.path.join('.').toLowerCase()
    const pathB = b.path.join('.').toLowerCase()
    return pathA.localeCompare(pathB)
  })

  const claimValues: unknown[] = sortedClaims.map((claim) => extractClaimValue(document, claim.path))
  const claimString = claimValues.map((value) => serializeValue(value)).join('|')
  return createHash('sha256').update(claimString, 'utf8').digest('hex')
}

function extractClaimValue(document: MDocDocument, path: string[]): unknown {
  invariant(path.length === 2, `Invalid claim path: ${path.join('.')}. Expected [namespace, elementIdentifier]`)

  const [namespace, elementIdentifier] = path
  invariant(document.issuerSigned?.nameSpaces, 'Document does not contain issuer-signed namespaces')
  invariant(namespace, `Invalid claim path: ${path.join('.')}. Expected [namespace, elementIdentifier]`)

  const namespaceItems = document.issuerSigned.nameSpaces[namespace]
  invariant(namespaceItems, `Namespace ${namespace} not found in document`)

  const item = namespaceItems.find(
    (item: { issuerSignedItem: { elementIdentifier: string } }) => item.issuerSignedItem.elementIdentifier === elementIdentifier,
  )
  invariant(item, `ElementIdentifier ${elementIdentifier} not found in namespace ${namespace}`)
  return item.issuerSignedItem.elementValue
}

function serializeValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Uint8Array) return Buffer.from(value).toString('base64')

  invariant(typeof value === 'object', 'Value must be a primitive, date, or Unit8Array')
  invariant(!Array.isArray(value), 'Value must be a primitive, date, or Unit8Array')
  throw new Error('Unknown value type for serialisation')
}
