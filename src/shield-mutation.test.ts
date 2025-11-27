// All jest.mock calls must be at the top before any imports
// Import common mocks for shield permission tests
import './test/shield-mocks'

import { getDefaultContractInput } from './features/contracts/test/create-contract'
import { getEmptyTemplateInput } from './features/templates/test/create-template'
import { AppRoles, UserRoles } from './roles'
import { buildJwt, executeOperationAs, expectUnauthorizedError } from './test'

// These tests only cover the permission rules for mutations defined in the shield and not the behaviour of the mutations themselves.
// Hence the mutation will pass invalid data as input, but that is acceptable for the purpose of these tests as long as the authorization rules are enforced.
describe('Shield Rules - Mutation Permissions', () => {
  const testMutationPermissions = (
    allowedRoles: string[],
    unauthenticatedAccess: boolean,
    query: string,
    variables?: Record<string, unknown>,
  ) => {
    const allRoles = [...Object.values(UserRoles), ...Object.values(AppRoles)]
    const deniedRoles = allRoles.filter((role) => !allowedRoles.map(String).includes(String(role)))

    it.each(allowedRoles)('allows access for role: %s', async (role) => {
      const { errors } = await executeOperationAs({ query, variables }, buildJwt({ roles: [role] }))
      // For allowed roles, we consider it a pass if there are no errors,
      // or if the errors are not authorization related
      if (errors) {
        const authErrors = errors.filter((e) => e.message === 'Not Authorized!')
        expect(authErrors).toHaveLength(0)
      }
    })

    it.each(deniedRoles)('denies access for role: %s', async (role) => {
      const { errors } = await executeOperationAs({ query, variables }, buildJwt({ roles: [role] }))
      expect(errors).toBeDefined()
      expectUnauthorizedError(errors)
    })

    if (unauthenticatedAccess) {
      it('allows access for unauthenticated user', async () => {
        const { errors } = await executeOperationAs({ query, variables }, buildJwt({ tid: 'unauth', roles: [] }))
        // For unauthenticated access, we consider it a pass if there are no errors,
        // or if the errors are not authorization related
        if (errors) {
          const authErrors = errors.filter((e) => e.message === 'Not Authorized!')
          expect(authErrors).toHaveLength(0)
        }
      })
    } else {
      it('denies access for unauthenticated user', async () => {
        const { errors } = await executeOperationAs({ query, variables }, buildJwt({ tid: 'unauth', roles: [] }))
        expect(errors).toBeDefined()
        expectUnauthorizedError(errors)
      })
    }
  }

  describe('Contract mutations', () => {
    const contractId = 'abc'

    const createContractMutation = `
    mutation CreateContractForUpdateTest($input: ContractInput!) {
      createContract(input: $input) {
        id
        template {
          id
        }
        name
      }
    }`

    const updateContractMutation = `
    mutation UpdateContractShieldTest($id: ID!, $input: ContractInput!) {
      updateContract(id: $id, input: $input) {
        id
      }
    }`

    const deleteContractMutation = `
    mutation DeleteContractShieldTest($id: ID!) {
      deleteContract(id: $id)
    }`

    const deprecateContractMutation = `
    mutation DeprecateContractShieldTest($id: ID!) {
      deprecateContract(id: $id) {
        id
      }
    }`

    describe('createContract', () => {
      testMutationPermissions([UserRoles.credentialAdmin, AppRoles.contractAdmin], false, createContractMutation, {
        input: getDefaultContractInput(),
      })
    })

    describe('updateContract', () => {
      testMutationPermissions([UserRoles.credentialAdmin, AppRoles.contractAdmin], false, updateContractMutation, {
        id: contractId,
        input: getDefaultContractInput(),
      })
    })

    describe('deleteContract', () => {
      testMutationPermissions([UserRoles.credentialAdmin, AppRoles.contractAdmin], false, deleteContractMutation, {
        id: contractId,
      })
    })

    describe('deprecateContract', () => {
      testMutationPermissions([UserRoles.credentialAdmin, AppRoles.contractAdmin], false, deprecateContractMutation, {
        id: contractId,
      })
    })
  })

  describe('Template mutations', () => {
    const templateId = 'abc'

    const createTemplateMutation = `
      mutation CreateTemplateShieldTest($input: TemplateInput!) {
        createTemplate(input: $input) {
          id
        }
      }`
    const updateTemplateMutation = `
      mutation UpdateTemplateShieldTest($id: ID!, $input: TemplateInput!) {
        updateTemplate(id: $id, input: $input) {
          id
        }
      }`
    const deleteTemplateMutation = `
      mutation DeleteTemplateShieldTest($id: ID!) {
        deleteTemplate(id: $id)
      }`

    describe('createTemplate', () => {
      testMutationPermissions([UserRoles.credentialAdmin, AppRoles.contractAdmin], false, createTemplateMutation, {
        input: getEmptyTemplateInput(),
      })
    })

    describe('updateTemplate', () => {
      testMutationPermissions([UserRoles.credentialAdmin, AppRoles.contractAdmin], false, updateTemplateMutation, {
        id: templateId,
        input: getEmptyTemplateInput(),
      })
    })

    describe('deleteTemplate', () => {
      testMutationPermissions([UserRoles.credentialAdmin, AppRoles.contractAdmin], false, deleteTemplateMutation, {
        id: templateId,
      })
    })
  })

  describe('Issuance mutations', () => {
    const contractId = 'dummy-contract-id'

    const createIssuanceRequestMutation = `
      mutation CreateIssuanceRequestShieldTest($request: IssuanceRequestInput!) {
        createIssuanceRequest(request: $request) {
          ... on IssuanceResponse {
              requestId
              url
              qrCode
        }
          ... on RequestErrorResponse {
            error {
              code
              message
            }
          }
        }
      }`
    const revokeContractIssuancesMutation = `
      mutation RevokeContractIssuancesShieldTest($contractId: ID!) {
        revokeContractIssuances(contractId: $contractId)
      }`
    const revokeIdentityIssuancesMutation = `
      mutation RevokeIdentityIssuancesShieldTest($identityId: ID!) {
        revokeIdentityIssuances(identityId: $identityId)
      }`
    const revokeIssuanceMutation = `
      mutation RevokeIssuanceShieldTest($id: ID!) {
        revokeIssuance(id: $id) {
          id
        }
      }`
    const revokeIssuancesMutation = `
      mutation RevokeIssuancesShieldTest($ids: [ID!]!) {
        revokeIssuances(ids: $ids)
      }`
    const revokeUserIssuancesMutation = `
      mutation RevokeUserIssuancesShieldTest($userId: ID!) {
        revokeUserIssuances(userId: $userId)
      }`
    const revokeWalletIssuancesMutation = `
      mutation RevokeWalletIssuancesShieldTest($walletId: ID!) {
        revokeWalletIssuances(walletId: $walletId)
      }`

    describe('createIssuanceRequest', () => {
      testMutationPermissions([UserRoles.issuer, AppRoles.issue], false, createIssuanceRequestMutation, {
        request: {
          contractId: contractId,
          claims: {},
        },
      })
    })

    describe('revokeContractIssuances', () => {
      testMutationPermissions(
        [UserRoles.credentialAdmin, AppRoles.contractAdmin, UserRoles.credentialRevoker],
        false,
        revokeContractIssuancesMutation,
        {
          contractId: 'abc',
        },
      )
    })

    describe('revokeIdentityIssuances', () => {
      testMutationPermissions(
        [UserRoles.credentialAdmin, AppRoles.contractAdmin, UserRoles.credentialRevoker],
        false,
        revokeIdentityIssuancesMutation,
        {
          identityId: 'abc',
        },
      )
    })

    describe('revokeIssuance', () => {
      testMutationPermissions(
        [UserRoles.credentialAdmin, AppRoles.contractAdmin, UserRoles.credentialRevoker],
        false,
        revokeIssuanceMutation,
        {
          id: 'abc',
        },
      )
    })

    describe('revokeIssuances', () => {
      testMutationPermissions(
        [UserRoles.credentialAdmin, AppRoles.contractAdmin, UserRoles.credentialRevoker],
        false,
        revokeIssuancesMutation,
        {
          ids: ['abc'],
        },
      )
    })

    describe('revokeUserIssuances', () => {
      testMutationPermissions(
        [UserRoles.credentialAdmin, AppRoles.contractAdmin, UserRoles.credentialRevoker],
        false,
        revokeUserIssuancesMutation,
        {
          userId: 'abc',
        },
      )
    })

    describe('revokeWalletIssuances', () => {
      testMutationPermissions(
        [UserRoles.credentialAdmin, AppRoles.contractAdmin, UserRoles.credentialRevoker],
        false,
        revokeWalletIssuancesMutation,
        {
          walletId: 'abc',
        },
      )
    })
  })
})
