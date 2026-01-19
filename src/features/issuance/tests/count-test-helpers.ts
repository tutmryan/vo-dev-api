import { parseISO } from 'date-fns'

export const testTime = parseISO('2023-01-01T00:00:00Z')

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]!
}

export interface TestData {
  contracts: Array<{ id: string; name: string }>
  users: Array<{ id: string; name: string; email?: string; isApp: boolean }>
  identities: Array<{ id: string; name: string; issuer: string; identifier: string }>
}

export async function createTestData(): Promise<TestData> {
  const contracts = [
    { id: 'contract-1', name: 'Test Contract 1' },
    { id: 'contract-2', name: 'Test Contract 2' },
  ]

  const users = [
    { id: 'user-1', name: 'Test User 1', email: 'user1@example.com', isApp: false },
    { id: 'user-2', name: 'Test User 2', email: 'user2@example.com', isApp: false },
  ]

  const identities = [
    { id: 'identity-1', name: 'Test Identity 1', issuer: 'test-issuer', identifier: 'test-id-1' },
    { id: 'identity-2', name: 'Test Identity 2', issuer: 'test-issuer', identifier: 'test-id-2' },
  ]

  return { contracts, users, identities }
}
