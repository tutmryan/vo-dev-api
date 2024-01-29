import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import type { User as GraphUser } from '@microsoft/microsoft-graph-types'
import 'cross-fetch/polyfill'
import { randomUUID } from 'crypto'
import { Lazy } from '../util/lazy'

export interface GraphServiceConfig {
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

  config: GraphServiceConfig
  client = Lazy(() => {
    const { tenantId, clientId, clientSecret } = this.config.auth
    if (!tenantId || !clientId || !clientSecret) throw new Error('GraphService is not configured')
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
    const authProvider = new TokenCredentialAuthenticationProvider(credential, { scopes: ['https://graph.microsoft.com/.default'] })

    return Client.initWithMiddleware({
      authProvider: authProvider,
    })
  })

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
    const nameInput = encodeURIComponent(nameStartsWith)
    const result = (await this.client()
      .api('/users')
      .filter(`startswith(displayName,'${nameInput}') or startswith(givenName,'${nameInput}') or startswith(surname,'${nameInput}')`)
      .top(top)
      .select('displayName,id,identities,givenName,surname,userType')
      .get()) as { value: PartialUser[] }
    return result.value
  }
}

export type PartialUser = Pick<GraphUser, 'id' | 'displayName' | 'identities' | 'givenName' | 'surname' | 'userType'>
