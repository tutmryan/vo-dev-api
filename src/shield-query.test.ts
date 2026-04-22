// All jest.mock calls must be at the top before any imports
// Import common mocks for shield permission tests
import './test/shield-mocks'

import { AppRoles, UserRoles } from './roles'
import { buildJwt, executeOperationAs, expectUnauthorizedError } from './test'

// These tests only cover the permission rules for queries defined in the shield and not the behaviour of the queries themselves.
// Hence the query will pass invalid data as input, but that is acceptable for the purpose of these tests as long as the authorization rules are enforced.
describe('Shield Rules - Query Permissions', () => {
  // Helper function to test query permissions
  const testQueryPermissions = (
    allowedRoles: string[],
    unauthenticatedAccess: boolean,
    query: string,
    variables?: Record<string, unknown>,
  ) => {
    const allRoles = [...Object.values(UserRoles), ...Object.values(AppRoles)]
    const deniedRoles = allRoles.filter((role) => !allowedRoles.map(String).includes(String(role)))

    it.each(allowedRoles)(`allows access for role: %s`, async (role) => {
      const { errors } = await executeOperationAs({ query, variables }, buildJwt({ roles: [role] }))
      expect(errors).toBeUndefined()
    })

    it.each(deniedRoles)(`denies access for role: %s`, async (role) => {
      const { errors } = await executeOperationAs({ query, variables }, buildJwt({ roles: [role] }))
      expect(errors).toBeDefined()
      expectUnauthorizedError(errors)
    })

    if (unauthenticatedAccess) {
      it(`allows access for unauthenticated user`, async () => {
        const { errors } = await executeOperationAs({ query, variables }, buildJwt({ tid: 'unauth', roles: [] }))
        expect(errors).toBeUndefined()
      })
    } else {
      it(`denies access for unauthenticated user`, async () => {
        const { errors } = await executeOperationAs({ query, variables }, buildJwt({ tid: 'unauth', roles: [] }))
        expect(errors).toBeDefined()
        expectUnauthorizedError(errors)
      })
    }
  }

  describe('findContracts', () => {
    testQueryPermissions(
      [
        UserRoles.reader,
        UserRoles.issuer,
        UserRoles.credentialAdmin,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        UserRoles.supportAgent,
        AppRoles.issue,
        AppRoles.present,
        AppRoles.contractAdmin,
      ],
      false,
      `query FindContractsShieldTest {
        findContracts(limit: 10) {
          id
        }
      }
    `,
    )
  })

  describe('findPresentations', () => {
    testQueryPermissions(
      [
        UserRoles.reader,
        UserRoles.issuer,
        UserRoles.credentialAdmin,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        UserRoles.supportAgent,
        AppRoles.present,
      ],
      false,
      `query FindPresentationsShieldTest {
        findPresentations(limit: 10) {
          id
        }
      }
      `,
    )
  })

  describe('findIssuances', () => {
    testQueryPermissions(
      [
        UserRoles.reader,
        UserRoles.issuer,
        UserRoles.credentialAdmin,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        UserRoles.supportAgent,
        AppRoles.issue,
      ],
      false,
      `query FindIssuancesShieldTest($where: IssuanceWhere) {
findIssuances(where: $where, limit: 10) {
  id
}
}
`,
    )
  })

  describe('findCredentialRecords', () => {
    testQueryPermissions(
      [
        UserRoles.reader,
        UserRoles.issuer,
        UserRoles.credentialAdmin,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        UserRoles.supportAgent,
        AppRoles.issue,
      ],
      false,
      `query FindCredentialRecordsShieldTest($where: CredentialRecordWhere) {
findCredentialRecords(where: $where, limit: 10) {
  id
}
}
`,
    )
  })

  describe('credentialRecordCount', () => {
    testQueryPermissions(
      [
        UserRoles.reader,
        UserRoles.issuer,
        UserRoles.credentialAdmin,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        UserRoles.supportAgent,
        AppRoles.issue,
      ],
      false,
      `query CredentialRecordCountShieldTest($where: CredentialRecordWhere) {
credentialRecordCount(where: $where)
}
`,
    )
  })

  describe('findAsyncIssuanceRequests', () => {
    testQueryPermissions(
      [
        UserRoles.issuer,
        UserRoles.supportAgent,
        UserRoles.credentialAdmin,
        UserRoles.reader,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        AppRoles.issue,
      ],
      false,
      `
      query FindAsyncIssuanceRequestsShieldTest {
        findAsyncIssuanceRequests(limit: 10) {
          id
        }
      }
    `,
    )
  })

  describe('findIdentities', () => {
    testQueryPermissions(
      [
        UserRoles.reader,
        UserRoles.issuer,
        UserRoles.credentialAdmin,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        UserRoles.supportAgent,
        AppRoles.issue,
      ],
      false,
      `
      query FindIdentitiesShieldTest {
        findIdentities(limit: 10) {
          id
        }
      }
    `,
    )
  })

  describe('findUsers', () => {
    testQueryPermissions(
      [UserRoles.reader, UserRoles.issuer, UserRoles.credentialAdmin, UserRoles.partnerAdmin, UserRoles.oidcAdmin, UserRoles.instanceAdmin],
      false,
      `
      query FindUsersShieldTest {
        findUsers(limit: 10) {
          id
        }
      }
    `,
    )
  })

  describe('findWallets', () => {
    testQueryPermissions(
      [
        UserRoles.reader,
        UserRoles.issuer,
        UserRoles.credentialAdmin,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        UserRoles.supportAgent,
        AppRoles.present,
      ],
      false,
      `
    query FindWalletsShieldTest {
      findWallets(limit: 10) {
        id
      }
    }
  `,
    )
  })

  describe('findTemplates', () => {
    testQueryPermissions(
      [
        UserRoles.reader,
        UserRoles.issuer,
        UserRoles.credentialAdmin,
        UserRoles.partnerAdmin,
        UserRoles.oidcAdmin,
        UserRoles.instanceAdmin,
        AppRoles.contractAdmin,
      ],
      false,
      `
    query FindTemplatesShieldTest {
      findTemplates(limit: 10) {
        id
      }
    }
  `,
    )
  })

  describe('findPresentationFlows', () => {
    testQueryPermissions(
      [UserRoles.presentationFlowRead, AppRoles.presentationFlowRead],
      false,
      `
        query FindPresentationFlowsShieldTest {
          findPresentationFlows(limit: 10) {
            id
          }
        }
      `,
    )
  })

  describe('findPresentationFlowTemplates', () => {
    testQueryPermissions(
      [UserRoles.presentationFlowReadTemplate, AppRoles.presentationFlowReadTemplate],
      false,
      `
        query FindPresentationFlowTemplatesShieldTest {
          findPresentationFlowTemplates {
            id
          }
        }
      `,
    )
  })

  describe('findIdentityStores', () => {
    testQueryPermissions(
      [UserRoles.issuer, UserRoles.credentialAdmin, UserRoles.instanceAdmin, AppRoles.issue],
      false,
      `
      query FindIdentityStoresShieldTest {
        findIdentityStores(limit: 10) {
          id
        }
      }
    `,
    )
  })

  describe('findNetworkIssuers', () => {
    testQueryPermissions(
      [UserRoles.partnerAdmin],
      false,
      `
      query FindNetworkIssuersShieldTest($where: NetworkIssuersWhere!) {
        findNetworkIssuers(where: $where) {
          id
        }
      }
    `,
      { where: { linkedDomainUrlsLike: '*' } },
    )
  })

  describe('accessPackages', () => {
    testQueryPermissions(
      [UserRoles.credentialAdmin],
      false,
      `
      query AccessPackagesShieldTest($contractId: ID!) {
        accessPackages(contractId: $contractId) {
          id
          displayName
        }
      }
    `,
      { contractId: 'test-contract-id' },
    )
  })

  describe('identityStoreCapabilities', () => {
    testQueryPermissions(
      [UserRoles.instanceAdmin],
      false,
      `
      query IdentityStoreCapabilitiesShieldTest($id: ID!) {
        identityStoreCapabilities(id: $id) {
          tapWrite
          tapPolicyInsight
          accessPackages
        }
      }
    `,
      { id: 'test-store-id' },
    )
  })
})
