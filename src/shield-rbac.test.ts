import { buildContractInput } from './features/contracts/test/create-contract'
import { updateContractMutation } from './features/contracts/test/update-contract'
import { createIssuanceRequestMutation } from './features/issuance/tests/create-issuance'
import { graphql } from './generated'
import type { AcquireLimitedAccessTokenInput, CreatePartnerInput } from './generated/graphql'
import { UserRoles } from './roles'
import { beforeAfterAll, buildJwt, executeOperationAs, executeOperationAsCredentialAdmin, expectUnauthorizedError } from './test'

const createPartnerMutation = graphql(
  `
  mutation CreatePartner($input: CreatePartnerInput!) {
    createPartner(input: $input) {
      id
    }
  }
` as const,
)
const acquireLimitedAccessTokenMutation = graphql(
  `
    mutation AcquireLimitedAccessToken($input: AcquireLimitedAccessTokenInput!) {
      acquireLimitedAccessToken(input: $input) {
        expires
        token
      }
    }
  ` as const,
)
describe('smoke test shield rules application', () => {
  beforeAfterAll()

  it.each([UserRoles.credentialAdmin, UserRoles.partnerAdmin, UserRoles.reader])(
    'issuing a credential is not authorised for %s role',
    async () => {
      const { errors } = await executeOperationAsCredentialAdmin({
        query: createIssuanceRequestMutation,
        variables: { request: { contractId: 'contract-1' } },
      })
      expect(errors).toBeDefined()
      expectUnauthorizedError(errors)
    },
  )

  it.each([UserRoles.credentialAdmin, UserRoles.issuer, UserRoles.reader])('creating a partner is not authorised for %s role', async () => {
    const { errors } = await executeOperationAsCredentialAdmin({
      query: createPartnerMutation,
      variables: { input: { name: 'Partner-1', did: 'partner-did-1', credentialTypes: ['partner-type-1'] } as CreatePartnerInput },
    })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it.each([UserRoles.credentialAdmin, UserRoles.issuer, UserRoles.partnerAdmin, UserRoles.reader])(
    'acquiring limited access token is not authorised for %s role',
    async (role) => {
      const { errors } = await executeOperationAs(
        {
          query: acquireLimitedAccessTokenMutation,
          variables: {
            input: {} as AcquireLimitedAccessTokenInput,
          },
        },
        buildJwt({ roles: [role] }),
      )
      expect(errors).toBeDefined()
      expectUnauthorizedError(errors)
    },
  )

  it.each([UserRoles.partnerAdmin, UserRoles.issuer, UserRoles.reader])(
    'updating a contract is not authorised for %s role',
    async (role) => {
      const { errors } = await executeOperationAs(
        {
          query: updateContractMutation,
          variables: {
            id: 'contract-1',
            input: buildContractInput({}),
          },
        },
        buildJwt({ roles: [role] }),
      )
      expect(errors).toBeDefined()
      expectUnauthorizedError(errors)
    },
  )
})
