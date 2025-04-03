import { graphql } from '../../generated'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsPartnerAdmin, expectUnauthorizedError } from '../../test'

function getUniqueDid(): string {
  return `did:example:${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

const createPartnerMutation = graphql(`
  mutation CreatePartnerTest($input: CreatePartnerInput!) {
    createPartner(input: $input) {
      id
      did
      name
    }
  }
`)

const updatePartnerMutation = graphql(`
  mutation UpdatePartner($id: ID!, $input: UpdatePartnerInput!) {
    updatePartner(id: $id, input: $input) {
      id
      did
      name
      credentialTypes
    }
  }
`)

const deletePartnerMutation = graphql(`
  mutation DeletePartner($id: ID!) {
    deletePartner(id: $id) {
      id
      did
      name
    }
  }
`)

const partnerQuery = graphql(`
  query Partner($id: ID!) {
    partner(id: $id) {
      id
      did
      name
      credentialTypes
      deletedAt
    }
  }
`)

const createPartnerMutationInput = {
  input: {
    name: 'Test Partner',
    did: 'did:example:123',
    credentialTypes: ['type1', 'type2'],
    tenantId: '36faedc5-b6f9-4c4e-a514-b925df3447ee',
    issuerId: 'ea555a2b-65da-4263-b280-7618b6555017',
    linkedDomainUrls: ['https://example.com'],
  },
}

const updatePartnerMutationInput = {
  input: {
    name: 'Updated Test Partner',
    credentialTypes: ['type1', 'type2', 'type3'],
  },
}

describe('Partner', () => {
  describe('createPartner mutation', () => {
    beforeAfterAll()

    it('returns partner id and details when called as partner admin', async () => {
      const uniqueInput = { input: { ...createPartnerMutationInput.input, did: getUniqueDid() } }
      const { data, errors } = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: uniqueInput,
      })

      expect(data).toMatchObject({
        createPartner: {
          id: expect.any(String),
          did: uniqueInput.input.did,
          name: createPartnerMutationInput.input.name,
        },
      })
      expect(errors).toBeUndefined()
    })
  })

  describe('updatePartner mutation', () => {
    beforeAfterAll()
    it('returns updated partner details when called as partner admin', async () => {
      const uniqueInput = { input: { ...createPartnerMutationInput.input, did: getUniqueDid() } }
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: uniqueInput,
      })
      const partnerId = createResult.data?.createPartner.id
      expect(partnerId).toBeDefined()

      const { data, errors } = await executeOperationAsPartnerAdmin({
        query: updatePartnerMutation,
        variables: { id: partnerId!, ...updatePartnerMutationInput },
      })

      expect(data).toMatchObject({
        updatePartner: {
          id: partnerId,
          name: updatePartnerMutationInput.input.name,
          credentialTypes: updatePartnerMutationInput.input.credentialTypes,
        },
      })
      expect(errors).toBeUndefined()
    })
  })

  describe('deletePartner mutation', () => {
    beforeAfterAll()

    it('returns deleted partner details when called as partner admin and set deletedAt field', async () => {
      const uniqueInput = { input: { ...createPartnerMutationInput.input, did: getUniqueDid() } }
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: uniqueInput,
      })
      const partnerId = createResult.data?.createPartner.id
      expect(partnerId).toBeDefined()

      const { data, errors } = await executeOperationAsPartnerAdmin({
        query: deletePartnerMutation,
        variables: { id: partnerId! },
      })

      expect(data).toMatchObject({
        deletePartner: {
          id: partnerId,
          did: uniqueInput.input.did,
          name: createPartnerMutationInput.input.name,
        },
      })
      expect(errors).toBeUndefined()

      //Call partner query to check deletedAt has been set
      const partnerResult = await executeOperationAsPartnerAdmin({
        query: partnerQuery,
        variables: { id: partnerId! },
      })
      expect(partnerResult.data?.partner.deletedAt).toBeDefined()
    })
  })

  // Unauthorized operations
  describe('unauthorized operations', () => {
    beforeAfterAll()

    it('should not allow anonymous users to call createPartner', async () => {
      const uniqueInput = { input: { ...createPartnerMutationInput.input, did: getUniqueDid() } }
      const { data, errors } = await executeOperationAnonymous({
        query: createPartnerMutation,
        variables: uniqueInput,
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('should not allow anonymous users to call updatePartner', async () => {
      const uniqueInput = { input: { ...createPartnerMutationInput.input, did: getUniqueDid() } }
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: uniqueInput,
      })
      const partnerId = createResult.data?.createPartner.id
      expect(partnerId).toBeDefined()

      const { data, errors } = await executeOperationAnonymous({
        query: updatePartnerMutation,
        variables: { id: partnerId!, ...updatePartnerMutationInput },
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('should not allow anonymous users to call deletePartner', async () => {
      const uniqueInput = { input: { ...createPartnerMutationInput.input, did: getUniqueDid() } }
      const createResult = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: uniqueInput,
      })
      const partnerId = createResult.data?.createPartner.id
      expect(partnerId).toBeDefined()

      const { data, errors } = await executeOperationAnonymous({
        query: deletePartnerMutation,
        variables: { id: partnerId! },
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })
  })

  describe('partner happy path', () => {
    beforeAfterAll()

    it('creates, updates, deletes, and revives partner and returns same id for same did', async () => {
      // Create partner
      const createResult1 = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: createPartnerMutationInput,
      })
      const partnerId1 = createResult1.data?.createPartner.id
      expect(partnerId1).toBeDefined()
      const partnerDid = createResult1.data?.createPartner.did
      expect(partnerDid).toBeDefined()

      // Update partner
      const updateResult = await executeOperationAsPartnerAdmin({
        query: updatePartnerMutation,
        variables: { id: partnerId1!, ...updatePartnerMutationInput },
      })
      expect(updateResult.data?.updatePartner).toMatchObject({
        id: partnerId1,
        name: updatePartnerMutationInput.input.name,
        credentialTypes: updatePartnerMutationInput.input.credentialTypes,
      })

      // Delete partner
      const deleteResult = await executeOperationAsPartnerAdmin({
        query: deletePartnerMutation,
        variables: { id: partnerId1! },
      })
      expect(deleteResult.data?.deletePartner).toMatchObject({
        id: partnerId1,
        did: partnerDid,
        name: updatePartnerMutationInput.input.name,
      })

      // Revive partner
      const createResult2 = await executeOperationAsPartnerAdmin({
        query: createPartnerMutation,
        variables: createPartnerMutationInput,
      })
      const partnerId2 = createResult2.data?.createPartner.id
      expect(partnerId2).toBeDefined()

      expect(partnerId2).toBe(partnerId1)
    })
  })
})
