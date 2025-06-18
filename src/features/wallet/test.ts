import { v4 as uuidv4 } from 'uuid'
import { graphql } from '../../generated'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsCredentialAdmin,
  expectToBeUndefined,
  expectUnauthorizedError,
  inTransaction,
} from '../../test'
import { createIdentity } from '../identity/tests/create-identity'
import { PresentationEntity } from '../presentation/entities/presentation-entity'
import { UserEntity } from '../users/entities/user-entity'
import { WalletEntity } from './entities/wallet-entity'

export async function insertMockWalletAndPresentation(identityId: string, subject: string, presentedAt: Date, walletId: string = uuidv4()) {
  const userId = uuidv4()
  const subjectHash = WalletEntity.createSubjectHash(subject)

  await inTransaction(async (em) => {
    await em.getRepository(UserEntity).save({
      id: userId,
      oid: uuidv4(),
      tenantId: uuidv4(),
      email: 'test@example.com',
      name: 'Test User',
      isApp: false,
    })
  }, userId)

  await inTransaction(async (em) => {
    const existing = await em.getRepository(WalletEntity).findOneBy({ id: walletId })
    if (!existing) {
      await em.getRepository(WalletEntity).save({
        id: walletId,
        subject,
        subjectHash,
      })
    }
  }, userId)

  const presentation = new PresentationEntity({
    requestId: uuidv4(),
    identityId,
    requestedById: userId,
    issuanceIds: [],
    requestedCredentials: [
      {
        type: 'VerifiableCredential',
        configuration: { validation: { allowRevoked: true } },
        acceptedIssuers: ['did:web:some.issuer.com'],
      },
    ],
    presentedCredentials: [
      {
        issuer: 'did:web:some.issuer.com',
        type: ['VerifiableCredential'],
        credentialState: { revocationStatus: 'VALID' },
      },
    ],
    partnerIds: [],
    walletId,
  })
  presentation.presentedAt = presentedAt

  await inTransaction(async (em) => {
    await em.getRepository(PresentationEntity).save(presentation)
  }, userId)

  return { walletId, subject, userId }
}

export const findWalletsQuery = graphql(`
  query FindWallets($where: WalletWhere) {
    findWallets(where: $where) {
      firstUsed
      lastUsed
      subject
      presentations {
        identity {
          id
        }
      }
    }
  }
`)

describe('Wallets', () => {
  describe('findWallets query', () => {
    beforeAfterAll()

    it('returns a wallet with related presentation', async () => {
      const identity = await createIdentity()
      const subject = 'did:ion:wallet'
      const presentedAt = new Date('2025-01-01T12:00:00Z')
      const { walletId } = await insertMockWalletAndPresentation(identity.id, subject, presentedAt)

      const { data, errors } = await executeOperationAsCredentialAdmin({
        query: findWalletsQuery,
        variables: {
          where: { id: walletId },
        },
      })

      expectToBeUndefined(errors)
      expect(data?.findWallets).toHaveLength(1)

      const wallet = data?.findWallets[0]
      expect(wallet?.subject).toStrictEqual(subject)
      expect(wallet?.firstUsed).toStrictEqual(presentedAt)
      expect(wallet?.lastUsed).toStrictEqual(presentedAt)
      expect(wallet?.presentations[0]?.identity?.id).toBe(identity.id)
    })

    it('returns a single wallet with multiple uses', async () => {
      const identity = await createIdentity()
      const subject = 'did:ion:reusedwallet'
      const walletId = uuidv4()

      const firstUse = new Date('2025-01-01T00:00:00Z')
      const secondUse = new Date('2025-01-02T00:00:00Z')

      await insertMockWalletAndPresentation(identity.id, subject, firstUse, walletId)
      await insertMockWalletAndPresentation(identity.id, subject, secondUse, walletId)

      const { data, errors } = await executeOperationAsCredentialAdmin({
        query: findWalletsQuery,
        variables: { where: { identityId: identity.id } },
      })

      expectToBeUndefined(errors)
      expect(data?.findWallets).toHaveLength(1)

      const wallet = data?.findWallets[0]
      expect(wallet?.firstUsed).toStrictEqual(firstUse)
      expect(wallet?.lastUsed).toStrictEqual(secondUse)
    })

    it('returns multiple wallets with single use each', async () => {
      const identity = await createIdentity()

      const presentedAt1 = new Date('2025-02-01T00:00:00Z')
      const presentedAt2 = new Date('2025-02-02T00:00:00Z')

      await insertMockWalletAndPresentation(identity.id, 'did:ion:wallet1', presentedAt1)
      await insertMockWalletAndPresentation(identity.id, 'did:ion:wallet2', presentedAt2)

      const { data, errors } = await executeOperationAsCredentialAdmin({
        query: findWalletsQuery,
        variables: { where: { identityId: identity.id } },
      })

      expectToBeUndefined(errors)
      expect(data?.findWallets).toHaveLength(2)

      expect(data?.findWallets[0]?.presentations[0]?.identity?.id).toBe(identity.id)
      expect(data?.findWallets[1]?.presentations[0]?.identity?.id).toBe(identity.id)

      const wallet1 = data?.findWallets.find((w) => w.subject === 'did:ion:wallet1')
      const wallet2 = data?.findWallets.find((w) => w.subject === 'did:ion:wallet2')

      expect(wallet1?.firstUsed).toStrictEqual(presentedAt1)
      expect(wallet1?.lastUsed).toStrictEqual(presentedAt1)
      expect(wallet2?.firstUsed).toStrictEqual(presentedAt2)
      expect(wallet2?.lastUsed).toStrictEqual(presentedAt2)
    })

    it('returns a single wallet used by multiple identities', async () => {
      const identity1 = await createIdentity()
      const identity2 = await createIdentity()

      const subject = 'did:ion:sharedwallet'
      const walletId = uuidv4()

      const presentedAt1 = new Date('2025-03-01T00:00:00Z')
      const presentedAt2 = new Date('2025-03-02T00:00:00Z')

      await insertMockWalletAndPresentation(identity1.id, subject, presentedAt1, walletId)
      await insertMockWalletAndPresentation(identity2.id, subject, presentedAt2, walletId)

      const { data, errors } = await executeOperationAsCredentialAdmin({
        query: findWalletsQuery,
        variables: {
          where: { subject },
        },
      })

      expectToBeUndefined(errors)
      expect(data?.findWallets).toHaveLength(1)

      const wallet = data?.findWallets[0]
      expect(wallet?.subject).toBe(subject)
      expect(wallet?.firstUsed).toStrictEqual(presentedAt1)
      expect(wallet?.lastUsed).toStrictEqual(presentedAt2)

      const presentationIdentities = wallet?.presentations.map((p) => p.identity?.id)
      expect(presentationIdentities).toContain(identity1.id)
      expect(presentationIdentities).toContain(identity2.id)
    })

    it('returns unauthorized when called with unauthorized role', async () => {
      const { errors } = await executeOperationAnonymous({
        query: findWalletsQuery,
      })
      expectUnauthorizedError(errors)
    })
  })
})
