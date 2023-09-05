import casual from 'casual'
import { randomUUID } from 'crypto'
import { dataSource } from '../../../data'
import { graphql } from '../../../generated'
import type { AcquireLimitedAccessTokenInput } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAsLimitedAccessClient, expectToBeDefined, expectUnauthorizedError } from '../../../test'
import { createContract, getDefaultContractInput } from '../../contracts/test/create-contract'
import { createIdentity } from '../../identity/create-update-identity.test'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { UserEntity } from '../../users/entities/user-entity'

const findContractsQuery = graphql(`
  query FindContracts($where: ContractWhere, $forIdentityId: ID) {
    findContracts(where: $where) {
      id
      credentialTypes
      display {
        card {
          title
          issuedBy
          backgroundColor
          textColor
          description
          logo {
            uri
            image
            description
          }
        }
      }
      issuances(where: { identityId: $forIdentityId }, limit: 1) {
        id
        issuedAt
        credentialExpiresAt
      }
      presentations(where: { identityId: $forIdentityId }, limit: 1) {
        id
        presentedAt
      }
    }
  }
`)

const contractQuery = graphql(`
  query Contract($id: ID!, $forIdentityId: ID) {
    contract(id: $id) {
      id
      credentialTypes
      display {
        card {
          title
          issuedBy
          backgroundColor
          textColor
          description
          logo {
            uri
            image
            description
          }
        }
      }
      issuances(where: { identityId: $forIdentityId }, limit: 1) {
        id
        issuedAt
        credentialExpiresAt
      }
      presentations(where: { identityId: $forIdentityId }, limit: 1) {
        id
        presentedAt
      }
    }
  }
`)

const findIssuancesQuery = graphql(`
  query FindIssuances($where: IssuanceWhere) {
    findIssuances(where: $where) {
      issuedAt
    }
  }
`)

const credentialTypesQuery = graphql(`
  query CredentialTypes {
    credentialTypes
  }
`)

async function createContractWithIssuance() {
  const identity = await createIdentity()
  const contract = await createContract(getDefaultContractInput())
  const issuedBy = await dataSource
    .getRepository(UserEntity)
    .save(new UserEntity({ email: casual.email, isApp: true, name: 'Test', oid: randomUUID(), tenantId: randomUUID() }))
  const issuance = await dataSource.getRepository(IssuanceEntity).save(
    new IssuanceEntity({
      id: randomUUID(),
      requestId: randomUUID(),
      contractId: contract.id,
      identityId: identity.id,
      issuedById: issuedBy.id,
      expiresAt: new Date(),
    }),
  )
  return { identity, contract, issuedBy, issuance }
}

describe('list contracts and identity-based access', () => {
  beforeAfterAll()

  it('can find contracts with issuances (and presentations) for the given identity', async () => {
    const {
      identity,
      contract: { id },
    } = await createContractWithIssuance()
    const limitedAccessData: AcquireLimitedAccessTokenInput = { identityId: identity.id, listContracts: true }

    const { data, errors } = await executeOperationAsLimitedAccessClient(
      { query: findContractsQuery, variables: { forIdentityId: identity.id } },
      limitedAccessData,
    )

    expect(errors).toBeUndefined()

    expectToBeDefined(data?.findContracts)
    const contract = data?.findContracts.find((c) => c.id === id.toUpperCase())
    expectToBeDefined(contract)

    expectToBeDefined(contract.issuances)
    expect(contract.issuances.length).toBeGreaterThanOrEqual(1)
  })

  it('cannot find contracts with issuances (and presentations) for a different identity', async () => {
    const { identity } = await createContractWithIssuance()
    const limitedAccessData: AcquireLimitedAccessTokenInput = { identityId: identity.id, listContracts: true }

    const { errors } = await executeOperationAsLimitedAccessClient(
      { query: findContractsQuery, variables: { forIdentityId: randomUUID() } },
      limitedAccessData,
    )

    expectUnauthorizedError(errors)
  })

  it('cannot find contracts with issuances (and presentations) without an identity specified', async () => {
    const { identity } = await createContractWithIssuance()
    const limitedAccessData: AcquireLimitedAccessTokenInput = { identityId: identity.id, listContracts: true }

    const { errors } = await executeOperationAsLimitedAccessClient({ query: findContractsQuery }, limitedAccessData)

    expectUnauthorizedError(errors)
  })

  it('cannot run other queries with a list contracts token', async () => {
    const { errors } = await executeOperationAsLimitedAccessClient(
      { query: credentialTypesQuery },
      { identityId: randomUUID(), listContracts: true },
    )
    expectUnauthorizedError(errors)
  })

  it('can find issuances for the given identity', async () => {
    const { identity } = await createContractWithIssuance()
    const limitedAccessData: AcquireLimitedAccessTokenInput = { identityId: identity.id, listContracts: true }

    const { data } = await executeOperationAsLimitedAccessClient(
      { query: findIssuancesQuery, variables: { where: { identityId: identity.id } } },
      limitedAccessData,
    )

    expectToBeDefined(data?.findIssuances)
    expect(data?.findIssuances.length).toBeGreaterThanOrEqual(1)
  })

  it('cannot find issuances for a different identity', async () => {
    const { identity } = await createContractWithIssuance()
    const limitedAccessData: AcquireLimitedAccessTokenInput = { identityId: identity.id, listContracts: true }

    const { errors, data } = await executeOperationAsLimitedAccessClient(
      { query: findIssuancesQuery, variables: { where: { identityId: randomUUID() } } },
      limitedAccessData,
    )

    expect(data?.findIssuances).toBeUndefined()
    expectUnauthorizedError(errors)
  })
})

describe('issuance and data-access', () => {
  beforeAfterAll()

  it('can query issuable contract with issuance data for the given identity', async () => {
    const { identity, contract } = await createContractWithIssuance()
    const limitedAccessData: AcquireLimitedAccessTokenInput = { identityId: identity.id, issuableContractIds: [contract.id] }

    const { data, errors } = await executeOperationAsLimitedAccessClient(
      { query: contractQuery, variables: { id: contract.id, forIdentityId: identity.id } },
      limitedAccessData,
    )

    expect(errors).toBeUndefined()

    expectToBeDefined(data?.contract)
    expectToBeDefined(data.contract.issuances)
    expect(data.contract.issuances.length).toBeGreaterThanOrEqual(1)
  })

  it('cannot query contract with issuances with the another identity specified', async () => {
    const { identity, contract } = await createContractWithIssuance()
    const limitedAccessData: AcquireLimitedAccessTokenInput = { identityId: identity.id, issuableContractIds: [contract.id] }

    const { errors } = await executeOperationAsLimitedAccessClient(
      { query: contractQuery, variables: { id: contract.id, forIdentityId: randomUUID() } },
      limitedAccessData,
    )

    expectUnauthorizedError(errors)
  })

  it('cannot run other queries with an issuance token', async () => {
    const { errors } = await executeOperationAsLimitedAccessClient(
      { query: credentialTypesQuery },
      { identityId: randomUUID(), issuableContractIds: [randomUUID()] },
    )
    expectUnauthorizedError(errors)
  })
})
