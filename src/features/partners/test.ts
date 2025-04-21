import { faker } from '@faker-js/faker/locale/en'
import { graphql } from '../../generated'
import {
  CreatePartnerInput,
  CreatePartnerMutation,
  ResumePartnerMutation,
  SuspendPartnerMutation,
  UpdatePartnerInput,
  UpdatePartnerMutation,
} from '../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsPartnerAdmin, expectUnauthorizedError } from '../../test'

// Reset the faker seed to ensure consistent test data between runs
faker.seed(123)

function getUniqueDid(): string {
  return `did:example:${faker.string.uuid()}`
}

export const partnerFragment = graphql(`
  fragment PartnerFields on Partner {
    id
    did
    tenantId
    issuerId
    name
    credentialTypes
    linkedDomainUrls
    suspendedAt
  }
`)

const createPartnerMutation = graphql(`
  mutation CreatePartner($input: CreatePartnerInput!) {
    createPartner(input: $input) {
      ...PartnerFields
    }
  }
`)

const updatePartnerMutation = graphql(`
  mutation UpdatePartner($id: ID!, $input: UpdatePartnerInput!) {
    updatePartner(id: $id, input: $input) {
      ...PartnerFields
    }
  }
`)

const suspendPartnerMutation = graphql(`
  mutation SuspendPartner($id: ID!) {
    suspendPartner(id: $id) {
      ...PartnerFields
    }
  }
`)

const resumePartnerMutation = graphql(`
  mutation ResumePartner($id: ID!) {
    resumePartner(id: $id) {
      ...PartnerFields
    }
  }
`)

const getUniqueCreatePartnerInput = (): CreatePartnerInput => ({
  name: `${faker.company.name()} Partner`,
  did: getUniqueDid(),
  credentialTypes: faker.helpers.arrayElements(['t1', 't2', 't3', 't4', 't5', 't6', 't7'], { min: 1, max: 3 }).sort(),
  tenantId: faker.string.uuid(),
  issuerId: faker.string.uuid(),
  linkedDomainUrls: [faker.internet.url({ appendSlash: true })],
})

const getUniqueUpdatePartnerInput = (): UpdatePartnerInput => ({
  name: `${faker.company.name()} Partner`,
  credentialTypes: faker.helpers.arrayElements(['t1', 't2', 't3', 't4', 't5', 't6', 't7'], { min: 1, max: 3 }).sort(),
})

describe('Partner', () => {
  beforeAfterAll()
  describe('createPartner mutation', () => {
    it('returns partner id and details when called as partner admin', async () => {
      // Arrange
      const createVars = { input: { ...getUniqueCreatePartnerInput(), did: getUniqueDid() } }

      // Act
      const { data, errors } = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: createVars,
      })

      // Assert
      expect(errors).toBeUndefined()
      expect(data?.createPartner).toMatchObject({
        id: expect.any(String),
        did: createVars.input.did,
        tenantId: createVars.input.tenantId,
        issuerId: createVars.input.issuerId,
        name: createVars.input.name,
        credentialTypes: createVars.input.credentialTypes,
        linkedDomainUrls: createVars.input.linkedDomainUrls,
        suspendedAt: null,
      } satisfies Omit<CreatePartnerMutation['createPartner'], '__typename'>)
    })
  })

  describe('updatePartner mutation', () => {
    it('returns updated partner details when called as partner admin', async () => {
      // Arrange
      const createVars = { input: { ...getUniqueCreatePartnerInput(), did: getUniqueDid() } }
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: createVars,
      })
      const updateVars = { id: createResult.data!.createPartner.id, input: getUniqueUpdatePartnerInput() }

      // Act
      const { data, errors } = await executeOperationAsPartnerAdmin({
        query: updatePartnerMutation,
        variables: updateVars,
      })

      // Assert
      expect(errors).toBeUndefined()
      expect(data?.updatePartner).toMatchObject({
        id: updateVars.id,
        did: createVars.input.did,
        tenantId: createVars.input.tenantId,
        issuerId: createVars.input.issuerId,
        name: updateVars.input.name,
        credentialTypes: updateVars.input.credentialTypes,
        linkedDomainUrls: createVars.input.linkedDomainUrls,
        suspendedAt: null,
      } satisfies Omit<UpdatePartnerMutation['updatePartner'], '__typename'>)
    })
  })

  describe('suspendPartner mutation', () => {
    it('returns suspended partner details when called as partner admin', async () => {
      // Arrange
      const createVars = { input: { ...getUniqueCreatePartnerInput(), did: getUniqueDid() } }
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: createVars,
      })

      // Act
      const suspendVars = { id: createResult.data!.createPartner.id }
      const { data, errors } = await executeOperationAsPartnerAdmin({
        query: suspendPartnerMutation,
        variables: suspendVars,
      })

      // Assert
      expect(errors).toBeUndefined()
      expect(data?.suspendPartner).toMatchObject({
        id: suspendVars.id,
        suspendedAt: expect.any(Date),
      } satisfies Pick<SuspendPartnerMutation['suspendPartner'], 'id' | 'suspendedAt'>)
    })
  })

  describe('resumePartner mutation', () => {
    it('returns resumed partner details when called as partner admin', async () => {
      // Arrange
      const createVars = { input: { ...getUniqueCreatePartnerInput(), did: getUniqueDid() } }
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: createVars,
      })

      // Act
      const resumeVars = { id: createResult.data!.createPartner.id }
      const { data, errors } = await executeOperationAsPartnerAdmin({
        query: resumePartnerMutation,
        variables: resumeVars,
      })

      // Assert
      expect(errors).toBeUndefined()
      expect(data?.resumePartner).toMatchObject({
        id: resumeVars.id,
        suspendedAt: null,
      } satisfies Pick<ResumePartnerMutation['resumePartner'], 'id' | 'suspendedAt'>)
    })
  })

  // Unauthorized operations
  describe('unauthorized operations', () => {
    it('should not allow anonymous users to call createPartner', async () => {
      // Act
      const { data, errors } = await executeOperationAnonymous({
        query: createPartnerMutation,
        variables: { input: { ...getUniqueCreatePartnerInput(), did: getUniqueDid() } },
      })

      // Assert
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('should not allow anonymous users to call updatePartner', async () => {
      // Arrange
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: { input: { ...getUniqueCreatePartnerInput(), did: getUniqueDid() } },
      })

      // Act
      const { data, errors } = await executeOperationAnonymous({
        query: updatePartnerMutation,
        variables: { id: createResult.data!.createPartner.id, input: getUniqueUpdatePartnerInput() },
      })

      // Assert
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('should not allow anonymous users to call suspendPartner', async () => {
      // Arrange
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: { input: { ...getUniqueCreatePartnerInput(), did: getUniqueDid() } },
      })

      // Act
      const { data, errors } = await executeOperationAnonymous({
        query: suspendPartnerMutation,
        variables: { id: createResult.data!.createPartner.id },
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('should not allow anonymous users to call resumePartner', async () => {
      // Arrange
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: { input: { ...getUniqueCreatePartnerInput(), did: getUniqueDid() } },
      })

      // Act
      const { data, errors } = await executeOperationAnonymous({
        query: resumePartnerMutation,
        variables: { id: createResult.data!.createPartner.id },
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })
  })
})
