import type { HttpClientOptions } from '@makerxstudio/node-common'
import { HttpClient } from '@makerxstudio/node-common'
import type { BaseContext } from '../context'
import type { NetworkContract, NetworkIssuer, NetworkIssuersWhere } from '../generated/graphql'

interface Value<T> {
  value: T
}

export class NetworkService extends HttpClient<BaseContext> {
  constructor(options: HttpClientOptions<BaseContext>) {
    super(options)
  }

  public async findNetworkIssuers({ linkedDomainUrlsLike }: NetworkIssuersWhere): Promise<NetworkIssuer[]> {
    const { value: issuers } = await this.get<Value<NetworkIssuer[]>>(
      `v1.0/verifiableCredentialsNetwork/authorities?filter=${encodeURIComponent(`linkeddomainurls like ${linkedDomainUrlsLike}`)}`,
    )
    return issuers
  }

  public async contracts(tenantId: string, issuerId: string): Promise<NetworkContract[]> {
    const { value: contracts } = await this.get<Value<NetworkContract[]>>(
      `v1.0/tenants/${tenantId}/verifiableCredentialsNetwork/authorities/${issuerId}/contracts`,
    )
    return contracts
  }
}
