/*
  populate-presentations.ts
  - Connects to the project's TypeORM DataSource
  - Creates a small set of parent rows (users, identities, wallets) if missing
  - Reuses existing issuances and creates additional ones as needed (assumes 75% presentation rate)
  - Inserts presentations in batches of 20 until target count is reached
  - Links each presentation to a random issuance (and thus a contract)

  Run with:
    npx ts-node scripts/test-data-generation/populate-presentations.ts --count 20000
    npx ts-node scripts/test-data-generation/populate-presentations.ts --count 20000 --day-spread 30

  Options:
    --count <number>          Number of presentations to create (default: 20000)
    --day-spread <number>     Number of days to spread presentations across (default: 0 = all today)
*/

// Load environment variables from .env
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../.env') })

import { faker } from '@faker-js/faker'
import { randomUUID } from 'crypto'
import { argv } from 'process'
import 'reflect-metadata'

// Adjust these imports if project paths differ
import { dataSource } from '../../src/data/data-source'
import { addUserToManager } from '../../src/data/user-context-helper'
import { ContractEntity } from '../../src/features/contracts/entities/contract-entity'
import { IdentityStoreEntity } from '../../src/features/identity-store/entities/identity-store-entity'
import { IdentityEntity } from '../../src/features/identity/entities/identity-entity'
import { IssuanceEntity } from '../../src/features/issuance/entities/issuance-entity'
import { PresentationEntity } from '../../src/features/presentation/entities/presentation-entity'
import { UserEntity } from '../../src/features/users/entities/user-entity'
import { WalletEntity } from '../../src/features/wallet/entities/wallet-entity'
import { IdentityStoreType } from '../../src/generated/graphql'

type Args = { count: number; dateSpreadDays: number }

function parseArgs(): Args {
  const countArgIndex = argv.findIndex((a) => a === '--count')
  const count = countArgIndex >= 0 ? Number(argv[countArgIndex + 1]) : 20000

  const dateSpreadArgIndex = argv.findIndex((a) => a === '--day-spread')
  const dateSpreadDays = dateSpreadArgIndex >= 0 ? Number(argv[dateSpreadArgIndex + 1]) : 0

  return { count, dateSpreadDays }
}

async function ensureParents() {
  const userRepo = dataSource.getRepository(UserEntity)
  const identityRepo = dataSource.getRepository(IdentityEntity)
  const walletRepo = dataSource.getRepository(WalletEntity)
  const identityStoreRepo = dataSource.getRepository(IdentityStoreEntity)
  const contractRepo = dataSource.getRepository(ContractEntity)

  // Ensure identity stores exist first
  let identityStores = await identityStoreRepo.find({ take: 1 })
  if (identityStores.length === 0) {
    const store = new IdentityStoreEntity({
      identifier: 'seed-store',
      name: 'Seed Identity Store',
      type: IdentityStoreType.Manual,
      isAuthenticationEnabled: false,
    })
    await identityStoreRepo.save(store)
    identityStores = [store]
  }

  const users = await userRepo.find({ take: 10 })
  if (users.length === 0) {
    const created = [] as UserEntity[]
    for (let i = 0; i < 10; i++) {
      const u = new UserEntity({
        oid: randomUUID(),
        tenantId: randomUUID(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        isApp: false,
      })
      created.push(u)
    }
    await userRepo.save(created)
  }

  const identities = await identityRepo.find({ take: 10 })
  if (identities.length === 0) {
    const created = [] as IdentityEntity[]
    for (let i = 0; i < 10; i++) {
      const identity = new IdentityEntity({
        issuer: 'https://seed.example.com',
        identifier: randomUUID(),
        name: faker.person.fullName(),
        identityStoreId: identityStores[0]!.id,
      })
      created.push(identity)
    }
    await identityRepo.save(created)
  }

  const wallets = await walletRepo.find({ take: 10 })
  if (wallets.length === 0) {
    const created = [] as WalletEntity[]
    for (let i = 0; i < 10; i++) {
      const wallet = new WalletEntity({
        subject: `did:seed:${randomUUID()}`,
      })
      created.push(wallet)
    }
    await walletRepo.save(created)
  }

  // Ensure we have at least one contract
  const contracts = await contractRepo.find({ take: 1 })
  if (contracts.length === 0) {
    console.log('Warning: No contracts found in database. Presentations will not be linked to any contracts.')
    console.log('Please create contracts first for realistic test data.')
  }
}

function sampleRequestedCredentials() {
  return JSON.stringify([
    {
      type: 'VerifiedEmployee',
      configuration: {
        validation: {
          faceCheck: {
            matchConfidenceThreshold: 70,
          },
        },
      },
    },
  ])
}

function samplePresentedCredentials() {
  return JSON.stringify([
    {
      issuer: `did:ion:${faker.string.alphanumeric(50)}`,
      type: ['VerifiableCredential', 'VerifiedEmployee'],
      credentialState: {
        revocationStatus: 'VALID',
      },
      faceCheck: {
        matchConfidenceScore: faker.number.float({ min: 70, max: 99, multipleOf: 0.1 }),
        sourcePhotoQuality: faker.helpers.arrayElement(['HIGH', 'MEDIUM', 'LOW']),
      },
    },
  ])
}

function getRandomPastDate(maxDaysAgo: number): Date {
  if (maxDaysAgo === 0) {
    return new Date()
  }
  const now = new Date()
  const daysAgo = faker.number.int({ min: 0, max: maxDaysAgo })
  const pastDate = new Date(now)
  pastDate.setDate(pastDate.getDate() - daysAgo)
  return pastDate
}

async function main() {
  const { count, dateSpreadDays } = parseArgs()
  console.log(`Starting populate-presentations: target=${count}, dateSpreadDays=${dateSpreadDays}`)

  await dataSource.initialize()
  console.log('DataSource initialized')

  await ensureParents()

  const userRepo = dataSource.getRepository(UserEntity)
  const identityRepo = dataSource.getRepository(IdentityEntity)
  const walletRepo = dataSource.getRepository(WalletEntity)
  const contractRepo = dataSource.getRepository(ContractEntity)
  const issuanceRepo = dataSource.getRepository(IssuanceEntity)

  const users = await userRepo.find({ take: 10 })
  const identities = await identityRepo.find({ take: 10 })
  const wallets = await walletRepo.find({ take: 10 })
  const contracts = await contractRepo.find()

  if (contracts.length === 0) {
    console.error('ERROR: No contracts found. Please create contracts before generating presentations.')
    await dataSource.destroy()
    process.exit(1)
  }

  // Use the first user as the context for audit tracking
  const scriptUserId = users[0]!.id
  addUserToManager(dataSource.manager, scriptUserId)
  console.log(`Using user ${users[0]!.name} (${scriptUserId}) for audit tracking`)

  console.log(`Found ${contracts.length} contracts`)

  // Reuse existing issuances first - load in batches to avoid parameter limits
  const issuanceCount = await issuanceRepo.count()
  console.log(`Found ${issuanceCount} existing issuances in database`)

  const existingIssuances: IssuanceEntity[] = []
  const issuanceBatchSize = 1000
  for (let offset = 0; offset < issuanceCount; offset += issuanceBatchSize) {
    const batch = await issuanceRepo.find({
      take: issuanceBatchSize,
      skip: offset,
      select: ['id', 'contractId'], // Only select what we need to reduce memory usage
    })
    existingIssuances.push(...batch)
    if (existingIssuances.length % 5000 === 0 || existingIssuances.length === issuanceCount) {
      console.log(`Loaded issuances ${existingIssuances.length}/${issuanceCount}`)
    }
  }

  // Calculate how many issuances we need (assume 75% presentation rate)
  const presentationRate = 0.75
  const requiredIssuances = Math.ceil(count / presentationRate)
  const additionalIssuancesNeeded = Math.max(0, requiredIssuances - existingIssuances.length)

  console.log(`Need ${requiredIssuances} total issuances for ${count} presentations (${additionalIssuancesNeeded} additional)`)

  // Create additional issuances if needed
  const newIssuances: IssuanceEntity[] = []
  if (additionalIssuancesNeeded > 0) {
    console.log(`Creating ${additionalIssuancesNeeded} new issuances...`)
    const issuancesPerContract = Math.ceil(additionalIssuancesNeeded / contracts.length)

    for (const contract of contracts) {
      for (let i = 0; i < issuancesPerContract && newIssuances.length < additionalIssuancesNeeded; i++) {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        const issuance = new IssuanceEntity({
          id: randomUUID(),
          requestId: faker.string.alphanumeric(10),
          contractId: contract.id,
          identityId: identities[faker.number.int({ min: 0, max: identities.length - 1 })]!.id,
          issuedById: users[faker.number.int({ min: 0, max: users.length - 1 })]!.id,
          expiresAt,
          hasFaceCheckPhoto: faker.datatype.boolean(),
        })
        newIssuances.push(issuance)
      }
    }

    // Save new issuances in smaller batches to avoid parameter limits
    const issuanceBatchSize = 50
    for (let i = 0; i < newIssuances.length; i += issuanceBatchSize) {
      const batch = newIssuances.slice(i, i + issuanceBatchSize)

      // Use transaction and attach user context to the transaction manager
      await dataSource.transaction(async (transactionManager) => {
        addUserToManager(transactionManager, scriptUserId)
        await transactionManager.save(batch)
      })

      console.log(`Created issuances ${i + batch.length}/${newIssuances.length}`)
    }
  }

  // Combine existing and new issuances
  const allIssuances = [...existingIssuances, ...newIssuances]
  console.log(`Total issuances available: ${allIssuances.length}`)

  const presentationRepo = dataSource.getRepository(PresentationEntity)

  const batchSize = 20
  let inserted = 0

  console.log('Creating presentations...')
  while (inserted < count) {
    const batch: PresentationEntity[] = []
    const toCreate = Math.min(batchSize, count - inserted)
    for (let i = 0; i < toCreate; i++) {
      // Pick a random issuance from all available
      const issuance = allIssuances[faker.number.int({ min: 0, max: allIssuances.length - 1 })]!

      const presentation = new PresentationEntity({
        identityId: identities[faker.number.int({ min: 0, max: identities.length - 1 })]!.id,
        requestedById: users[faker.number.int({ min: 0, max: users.length - 1 })]!.id,
        walletId: wallets[faker.number.int({ min: 0, max: wallets.length - 1 })]!.id,
        requestId: faker.string.alphanumeric(10),
        requestedCredentials: JSON.parse(sampleRequestedCredentials()),
        presentedCredentials: JSON.parse(samplePresentedCredentials()),
        issuanceIds: [issuance.id],
        partnerIds: [],
      })

      // Set the presented date and receipt after construction
      presentation.presentedAt = getRandomPastDate(dateSpreadDays)
      presentation.receiptJson = null

      batch.push(presentation)
    }

    await presentationRepo.save(batch)
    inserted += batch.length
    console.log(`Inserted ${inserted}/${count}`)
  }

  console.log('Done inserting presentations')
  await dataSource.destroy()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
