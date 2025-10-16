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
import { Lazy } from '../util/lazy'
import { createIdentityStoreSecretService } from './identity-store-secret-service'

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
  client = Lazy(() => {
    if (!this.isConfigured) throw new Error('GraphService is not configured')
    const { tenantId, clientId, clientSecret } = this.config.auth
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
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
}

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

  get(identityStoreId: string): GraphService | undefined {
    return this.services[identityStoreId]
  }

  get all(): GraphService[] {
    return Object.values(this.services)
  }
}

export type IGraphServiceManager = InstanceType<typeof GraphServiceManager>
export const graphServiceManager = new GraphServiceManager()

export type PartialUser = Pick<GraphUser, 'id' | 'displayName' | 'identities' | 'givenName' | 'surname' | 'userType'>
