import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import type { User as GraphUser } from '@microsoft/microsoft-graph-types'
import 'cross-fetch/polyfill'
import { randomUUID } from 'crypto'
import { dataSource } from '../data'
import { IdentityStoreEntity } from '../features/identity-store/entities/identity-store-entity'
import type { MsGraphFailure } from '../generated/graphql'
import { IdentityStoreType } from '../generated/graphql'
import { logger } from '../logger'
import { newCacheSection } from '../redis/cache'
import { Lazy } from '../util/lazy'
import { createIdentityStoreSecretService } from './identity-store-secret-service'

const FIFTEEN_MINUTES_TTL = 1000 * 60 * 15

export interface AccessPackageAssignmentPolicy {
  id: string
  displayName: string
  description?: string
  accessPackage?: {
    id: string
    displayName: string
    description?: string
  }
  verifiableCredentialSettings?: {
    credentialTypes: Array<{
      credentialType: string
    }>
  }
}

export interface AccessPackageResult {
  id: string
  displayName: string
  description: string
  credentialTypes: string[]
  identityStoreName: string
  identityStoreId: string
  policyDisplayName: string
  policyDisplayDescription?: string
}

export interface AuthenticationMethodTarget {
  targetType: 'group' | 'user'
  id: string
  isRegistrationRequired?: boolean
}

export interface AuthenticationMethodConfiguration {
  id: string
  state: 'enabled' | 'disabled'
  includeTargets?: AuthenticationMethodTarget[]
  excludeTargets?: AuthenticationMethodTarget[]
}

export interface IdentityStoreCapabilities {
  tapWrite: boolean
  tapPolicyInsight: boolean
  accessPackages: boolean
}

export interface GraphServiceConfig {
  identityStoreId: string
  auth: {
    tenantId: string
    clientId: string
    clientSecret: string
  }
  tenantName: string
}

export class GraphService {
  constructor(config: GraphServiceConfig) {
    this.config = config
  }

  get isConfigured() {
    const {
      tenantName,
      auth: { tenantId, clientId, clientSecret },
    } = this.config
    return !!tenantName && !!tenantId && !!clientId && !!clientSecret
  }

  config: GraphServiceConfig

  credential = Lazy(() => {
    if (!this.isConfigured) throw new Error('GraphService is not configured')
    const { tenantId, clientId, clientSecret } = this.config.auth
    return new ClientSecretCredential(tenantId, clientId, clientSecret)
  })

  client = Lazy(() => {
    const credential = this.credential()
    const authProvider = new TokenCredentialAuthenticationProvider(credential, { scopes: ['https://graph.microsoft.com/.default'] })

    return Client.initWithMiddleware({
      authProvider: authProvider,
    })
  })

  async testConnection(): Promise<MsGraphFailure | undefined> {
    try {
      await this.findUsers({ nameStartsWith: 'a' }, 1)
      return undefined
    } catch (error) {
      return {
        identityStoreId: this.config.identityStoreId,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async createUser({
    givenName,
    email,
    familyName,
    forceChangePasswordNextSignInWithMfa = true,
  }: {
    givenName: string
    familyName: string
    email: string
    forceChangePasswordNextSignInWithMfa?: boolean
  }): Promise<GraphUser> {
    return await this.client()
      .api('/users')
      .post({
        displayName: `${givenName} ${familyName}`,
        accountEnabled: true,
        identities: [
          {
            issuer: this.config.tenantName,
            signInType: 'emailAddress',
            issuerAssignedId: email,
          },
        ],
        passwordProfile: {
          forceChangePasswordNextSignInWithMfa,
          password: randomUUID(),
        },
        givenName: givenName,
        surname: familyName,
      })
  }

  async getUser({ email }: { email: string }): Promise<PartialUser | undefined> {
    const result = (await this.client()
      .api(`/users`)
      .filter(`identities/any(c:c/issuerAssignedId eq '${encodeURIComponent(email)}' and c/issuer eq '${this.config.tenantName}')`)
      .select('displayName,id,identities,givenName,surname,userType')
      .get()) as { value: PartialUser[] }

    return result.value[0]
  }

  async getUserById(id: string): Promise<PartialUser | undefined> {
    const user = (await this.client()
      .api(`/users/${encodeURIComponent(id)}`)
      .select('displayName,id,identities,givenName,surname,userType')
      .get()) as PartialUser

    return user
  }

  async getUserByUserPrincipalName(upn: string): Promise<PartialUser | undefined> {
    const user = (await this.client()
      .api(`/users/${encodeURIComponent(upn)}`)
      .select('displayName,id,identities,givenName,surname,userType')
      .get()) as PartialUser

    return user
  }

  async getUserByEmail(email: string): Promise<PartialUser | undefined> {
    const encodedEmail = encodeURIComponent(email.replaceAll("'", "''"))
    const result = (await this.client()
      .api('/users')
      .filter(`mail eq '${encodedEmail}'`)
      .select('displayName,id,identities,givenName,surname,userType')
      .get()) as { value: PartialUser[] }

    return result.value[0]
  }

  async findUsers({ nameStartsWith }: { nameStartsWith: string }, top: number): Promise<PartialUser[]> {
    const nameInput = encodeURIComponent(nameStartsWith.replaceAll("'", "''")) //https://learn.microsoft.com/en-us/graph/query-parameters?tabs=javascript#escaping-single-quotes
    const result = (await this.client()
      .api('/users')
      .filter(`startswith(displayName,'${nameInput}') or startswith(givenName,'${nameInput}') or startswith(surname,'${nameInput}')`)
      .top(top)
      .select('displayName,id,identities,givenName,surname,userType')
      .get()) as { value: PartialUser[] }
    return result.value
  }

  /**
   * Fetches access package assignment policies from Microsoft Graph Entitlement Management API.
   * Requires EntitlementManagement.Read.All permission.
   * Results are cached for 15 minutes per identity store.
   */
  async getAccessPackageAssignmentPolicies(): Promise<AccessPackageAssignmentPolicy[] | 'missing_permissions'> {
    const cacheKey = `assignmentPolicies:${this.config.identityStoreId}`
    const cached = await accessPackagePoliciesCache().get(cacheKey)
    if (cached) return cached

    try {
      const result = (await this.client()
        .api('/identityGovernance/entitlementManagement/accessPackageAssignmentPolicies')
        .version('beta')
        .expand('accessPackage')
        .get()) as { value: AccessPackageAssignmentPolicy[] }

      const policies = result.value
      await accessPackagePoliciesCache().set(cacheKey, policies)
      return policies
    } catch (error) {
      if (isGraphMissingPermissionsError(error)) {
        logger.warn(
          `Access package policies not available for identity store ${this.config.identityStoreId} - missing EntitlementManagement.Read.All permission`,
        )
        return 'missing_permissions'
      }
      logger.warn(`Failed to fetch access package assignment policies for identity store ${this.config.identityStoreId} - regular error`, {
        error,
      })
      return []
    }
  }

  /**
   * Finds access packages that can be assigned when a credential with any of the specified types is presented.
   * Matches policies where at least one verifiableCredentialSettings.credentialType matches any of the provided types.
   */
  async findAccessPackages(credentialTypes: string[]): Promise<AccessPackageResult[]> {
    const policies = await this.getAccessPackageAssignmentPolicies()
    if (policies === 'missing_permissions') return []

    // Filter to only policies with accessPackage and matching credentialTypes
    const filteredPolicies = policies.filter(
      (
        policy,
      ): policy is AccessPackageAssignmentPolicy & { accessPackage: NonNullable<AccessPackageAssignmentPolicy['accessPackage']> } => {
        if (!policy.accessPackage) return false
        const policyTypes = policy.verifiableCredentialSettings?.credentialTypes
        if (!policyTypes || policyTypes.length === 0) return false
        const policyTypeStrings = policyTypes.map((ct) => ct.credentialType)
        return credentialTypes.some((type) => policyTypeStrings.includes(type))
      },
    )

    return filteredPolicies.map((policy) => {
      let types =
        policy.verifiableCredentialSettings?.credentialTypes
          .map((ct) => ct.credentialType)
          .filter((type) => credentialTypes.includes(type)) ?? []
      // Remove duplicates and sort alphabetically
      types = Array.from(new Set(types)).sort()
      return {
        id: policy.accessPackage.id,
        displayName: policy.accessPackage.displayName || '',
        description: policy.accessPackage.description || '',
        credentialTypes: types,
        identityStoreName: this.config.tenantName,
        identityStoreId: this.config.identityStoreId,
        policyDisplayName: policy.displayName,
        policyDisplayDescription: policy.description,
      }
    })
  }

  async createTemporaryAccessPass({
    userId,
    lifetimeInMinutes = 60,
    isUsableOnce = true,
  }: {
    userId: string
    lifetimeInMinutes?: number
    isUsableOnce?: boolean
  }): Promise<TemporaryAccessPassAuthenticationMethod> {
    return (await this.client().api(`/users/${userId}/authentication/temporaryAccessPassMethods`).post({
      lifetimeInMinutes,
      isUsableOnce,
    })) as TemporaryAccessPassAuthenticationMethod
  }

  // This requires Microsoft Graph API permissions: Policy.Read.AuthenticationMethod
  // Allows to check if the tenant has enabled the Temporary Access Pass authentication method
  // https://learn.microsoft.com/en-us/graph/api/authenticationmethodspolicy-get?view=graph-rest-1.0&tabs=http
  async getTemporaryAccessPassPolicy(): Promise<AuthenticationMethodConfiguration | undefined | 'missing_permissions'> {
    try {
      return (await this.client()
        .api('/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/temporaryAccessPass')
        .get()) as AuthenticationMethodConfiguration
    } catch (error) {
      if (isGraphMissingPermissionsError(error)) {
        return 'missing_permissions'
      }
      return undefined
    }
  }

  /**
   * Decodes the current Graph access token and returns the list of granted application roles.
   * This is the most reliable way to check application permissions without making extra API calls
   * that may return 404 before performing a permission check.
   */
  private async getGrantedRoles(): Promise<string[]> {
    try {
      const token = await this.credential().getToken('https://graph.microsoft.com/.default')
      const payloadBase64 = token.token.split('.')[1]!
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'))
      return Array.isArray(payload.roles) ? payload.roles : []
    } catch (error) {
      logger.warn(`Failed to decode Graph access token for identity store ${this.config.identityStoreId}`, { error })
      return []
    }
  }

  async checkCapabilities(): Promise<IdentityStoreCapabilities> {
    if (!this.isConfigured) {
      return {
        tapPolicyInsight: false,
        accessPackages: false,
        tapWrite: false,
      }
    }

    const [accessPackages, grantedRoles] = await Promise.all([this.getAccessPackageAssignmentPolicies(), this.getGrantedRoles()])

    const tapWrite = grantedRoles.includes('UserAuthMethod-TAP.ReadWrite.All')
    const tapPolicyInsight = grantedRoles.includes('Policy.Read.AuthenticationMethod')

    return {
      tapPolicyInsight,
      accessPackages: accessPackages !== 'missing_permissions',
      tapWrite,
    }
  }
}

export interface TemporaryAccessPassAuthenticationMethod {
  id: string
  temporaryAccessPass: string
  createdDateTime: string
  startDateTime: string
  lifetimeInMinutes: number
  isUsableOnce: boolean
  methodUsabilityReason?: string
}

const accessPackagePoliciesCache = Lazy(() =>
  newCacheSection<AccessPackageAssignmentPolicy[]>('accessPackagePolicies', FIFTEEN_MINUTES_TTL),
)

class GraphServiceManager {
  private services: Record<string, GraphService> = {}

  private initialised = false

  async reload(): Promise<void> {
    this.initialised = false
    return this.init()
  }

  async init() {
    if (this.initialised) return
    const clientSecretService = createIdentityStoreSecretService()
    this.services = {}
    const stores = await dataSource.getRepository(IdentityStoreEntity).find({
      where: { type: IdentityStoreType.Entra },
      comment: 'GraphServiceManagerInit',
    })

    for (const store of stores) {
      if (store.clientId && store.identifier) {
        try {
          const clientSecret = await clientSecretService.get(store.clientId)
          if (!clientSecret) continue
          this.services[store.id] = new GraphService({
            tenantName: store.name,
            identityStoreId: store.id,
            auth: {
              tenantId: store.identifier,
              clientId: store.clientId,
              clientSecret,
            },
          })
        } catch (error) {
          logger.error(`Failed to create GraphService for identity store ${store.id}`, { error })
        }
      }
    }
    this.initialised = true
  }

  async get(identityStoreId: string): Promise<GraphService | undefined> {
    if (!this.initialised) {
      await this.init()
    }
    const cachedService = this.services[identityStoreId]
    if (cachedService) return cachedService

    const store = await dataSource.getRepository(IdentityStoreEntity).findOne({
      where: { id: identityStoreId, type: IdentityStoreType.Entra },
      comment: 'GraphServiceManagerLazyFetch',
    })

    if (store && store.clientId && store.identifier) {
      try {
        const clientSecretService = createIdentityStoreSecretService()
        const clientSecret = await clientSecretService.get(store.clientId)
        if (clientSecret) {
          this.services[store.id] = new GraphService({
            tenantName: store.name,
            identityStoreId: store.id,
            auth: {
              tenantId: store.identifier,
              clientId: store.clientId,
              clientSecret,
            },
          })
          return this.services[store.id]
        }
      } catch (error) {
        logger.error(`Failed to lazy load GraphService for identity store ${store.id}`, { error })
      }
    }

    return undefined
  }

  get all(): GraphService[] {
    return Object.values(this.services)
  }

  /**
   * Finds all access packages across all configured Entra identity stores
   * that match the specified credential types exactly.
   */
  async findAllAccessPackages(credentialTypes: string[]): Promise<AccessPackageResult[]> {
    await this.init()
    const stores = await dataSource.getRepository(IdentityStoreEntity).find({
      where: { type: IdentityStoreType.Entra, accessPackagesEnabled: true },
    })
    const enabledStoreIds = stores.map((s) => s.id)
    const enabledServices = this.all.filter((service) => enabledStoreIds.includes(service.config.identityStoreId))

    const results = await Promise.all(enabledServices.map((service) => service.findAccessPackages(credentialTypes)))
    return results.flat()
  }

  clear(identityStoreId: string): void {
    delete this.services[identityStoreId]
  }
}

export type IGraphServiceManager = InstanceType<typeof GraphServiceManager>
export const graphServiceManager = new GraphServiceManager()

export type PartialUser = Pick<GraphUser, 'id' | 'displayName' | 'identities' | 'givenName' | 'surname' | 'userType'>

function isGraphMissingPermissionsError(error: any): boolean {
  if (!(error instanceof Error)) return false

  // Check common Graph error codes and status codes
  const code = (error as any).code
  const statusCode = (error as any).statusCode

  // 403 Forbidden is the standard permission error
  if (statusCode === 403) return true
  // Graph sometimes returns UnAuthorized for 403 scenarios in certain APIs
  if (code === 'Authorization_RequestDenied' || code === 'UnAuthorized') return true

  const message = error.message.toLowerCase()
  return (
    message.includes('authorization') || message.includes('authorized') || message.includes('forbidden') || message.includes('unauthorized')
  )
}
