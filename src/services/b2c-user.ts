import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import type { User as GraphUser } from '@microsoft/microsoft-graph-types'
import 'cross-fetch/polyfill'
import { randomUUID } from 'crypto'
import typedConfig from '../config'
import { Lazy } from '../util/lazy'

const GraphClient = Lazy(() => {
  const authConfig = typedConfig.get('integrations.b2cGraph.auth')

  const credential = new ClientSecretCredential(authConfig.tenantId, authConfig.clientId, authConfig.clientSecret)
  const authProvider = new TokenCredentialAuthenticationProvider(credential, { scopes: ['https://graph.microsoft.com/.default'] })

  return Client.initWithMiddleware({
    debugLogging: true,
    authProvider: authProvider,
  })
})

export class B2cUserService {
  get b2cDomain() {
    return `${typedConfig.get('integrations.b2cGraph.b2cTenantName')}.onmicrosoft.com`
  }

  get b2cLoginIssuer() {
    const b2cTenantName = typedConfig.get('integrations.b2cGraph.b2cTenantName')
    const b2cTenantId = typedConfig.get('integrations.b2cGraph.auth.tenantId')

    return `https://${b2cTenantName}.b2clogin.com/${b2cTenantId}/v2.0/`
  }

  async createB2cUser({ givenName, email, familyName }: { givenName: string; familyName: string; email: string }): Promise<GraphUser> {
    const graphClient = GraphClient()

    return await graphClient.api('/users').post({
      displayName: `${givenName} ${familyName}`,
      accountEnabled: true,
      identities: [
        {
          issuer: this.b2cDomain,
          signInType: 'emailAddress',
          issuerAssignedId: email,
        },
      ],
      passwordProfile: {
        forceChangePasswordNextSignInWithMfa: true,
        password: randomUUID(),
      },
      givenName: givenName,
      surname: familyName,
    })
  }

  async getB2cUser({ email }: { email: string }): Promise<PartialB2cUser | undefined> {
    const graphClient = GraphClient()

    const result = (await graphClient
      .api(`/users`)
      .filter(`identities/any(c:c/issuerAssignedId eq '${encodeURIComponent(email)}' and c/issuer eq '${this.b2cDomain}')`)
      .select('displayName,id,identities,givenName,surname')
      .get()) as { value: PartialB2cUser[] }

    return result.value[0]
  }
}

export type PartialB2cUser = Pick<GraphUser, 'id' | 'displayName' | 'identities' | 'givenName' | 'surname'>
