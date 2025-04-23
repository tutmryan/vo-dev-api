import { createHash } from 'crypto'

export function createSha256Hash(valueToHash: string): string {
  return createHash('sha256').update(valueToHash).digest('base64')
}
