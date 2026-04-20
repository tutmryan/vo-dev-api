import '../../test/shield-mocks'
import { apiUrl } from '../../config'
import { OidcScopes, UserRoles } from '../../roles'
import { buildIssueeJwt, buildJwt, executeOperationAs, expectUnauthorizedError } from '../../test'

describe('Shield Rules - Microsoft Entra TAP Query Permissions', () => {
  const testQueryPermissions = (
    allowedScopes: string[],
    query: string,
    variables?: Record<string, unknown>,
  ) => {
    it.each(allowedScopes)(`allows access for scope/role: %s`, async (scope) => {
      const jwt = scope === OidcScopes.issuee 
        ? buildIssueeJwt('test-identity-id') 
        : buildJwt({ roles: [scope], aud: apiUrl })
      
      const { errors } = await executeOperationAs({ query, variables }, jwt)
      
      const shieldError = errors?.find((e) => e.message === 'Not Authorized!')
      expect(shieldError).toBeUndefined()
    })

    it(`denies access for unauthenticated user`, async () => {
      const { errors } = await executeOperationAs({ query, variables }, buildJwt({ tid: 'unauth', roles: [] }))
      expect(errors).toBeDefined()
      expectUnauthorizedError(errors)
    })
  }

  describe('checkMyTapEligibility', () => {
    testQueryPermissions(
      [OidcScopes.issuee, UserRoles.reader, UserRoles.issuer, UserRoles.credentialAdmin],
      `query CheckMyTapEligibilityShieldTest {
        checkMyTapEligibility {
          id
          title
          enabled
        }
      }`,
    )
  })

  describe('findMicrosoftEntraTemporaryAccessPassIssuances', () => {
    testQueryPermissions(
      [UserRoles.reader, UserRoles.issuer, UserRoles.credentialAdmin, UserRoles.supportAgent],
      `query FindTapIssuancesShieldTest {
        findMicrosoftEntraTemporaryAccessPassIssuances {
          id
        }
      }`,
    )
  })
})
