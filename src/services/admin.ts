import type { HttpClientOptions } from '@makerxstudio/node-common'
import { HttpClient } from '@makerxstudio/node-common'
import type { BaseContext } from '../context'
import type { Authority, NetworkContract, NetworkIssuer, NetworkIssuersWhere } from '../generated/graphql'
import { invariant } from '../util/invariant'
import type { Contract, CreateContractInput, UpdateContractInput } from './admin.types'

interface Value<T> {
  value: T
}

// keep an authority reference at the module level
// to avoid having to repeatedly load it
let authority: Authority | undefined = undefined

export class AdminService extends HttpClient<BaseContext> {
  constructor(options: HttpClientOptions<BaseContext>) {
    super(options)
  }

  async authorities(): Promise<Authority[]> {
    const { value: authorities } = await this.get<Value<Authority[]>>('v1.0/verifiableCredentials/authorities')
    return authorities
  }

  async authorityById(id: string): Promise<Authority> {
    return this.get<Authority>(`v1.0/verifiableCredentials/authorities/${id}`)
  }

  async createContract(input: CreateContractInput): Promise<Contract> {
    try {
      return await this.post<Contract>(`v1.0/verifiableCredentials/authorities/${await this.authorityId()}/contracts`, { data: input })
    } catch (error: any) {
      const { message, ...rest } = error
      this.options.logger?.error('Error creating contract', { message, ...rest })
      throw error
    }
  }

  async updateContract(contractId: string, input: UpdateContractInput): Promise<Contract> {
    // The service is case-sensitive on GUIDs, and we get the contract ID from SQL Server / mssql as uppercase, so
    // we need to lowercase it ourselves #prettylame
    return await this.patch<Contract>(
      `v1.0/verifiableCredentials/authorities/${await this.authorityId()}/contracts/${contractId.toLowerCase()}`,
      {
        data: input,
      },
    )
  }

  async contracts(authorityId?: string): Promise<Contract[]> {
    const { value: contracts } = await this.get<Value<Contract[]>>(
      `v1.0/verifiableCredentials/authorities/${authorityId ?? (await this.authorityId())}/contracts`,
    )
    return contracts
  }

  async contract(id: string): Promise<Contract | null> {
    return this.get<Contract>(`v1.0/verifiableCredentials/authorities/${await this.authorityId()}/contracts/${id.toLowerCase()}`)
  }

  async authority(): Promise<Authority> {
    if (authority) return authority

    const { value: authorities } = await this.get<Value<Authority[]>>('v1.0/verifiableCredentials/authorities')

    const [first] = authorities
    invariant(first, 'Unable to find an authority when querying the Verified ID service')

    authority = first
    return authority
  }

  async authorityId(): Promise<string> {
    return (await this.authority()).id
  }

  async findNetworkIssuers({ linkedDomainUrlsLike }: NetworkIssuersWhere): Promise<NetworkIssuer[]> {
    const { value: issuers } = await this.get<Value<NetworkIssuer[]>>(
      `v1.0/verifiableCredentialsNetwork/authorities?filter=${encodeURIComponent(`linkeddomainurls like ${linkedDomainUrlsLike}`)}`,
    )
    return issuers
  }

  async networkContracts(tenantId: string, issuerId: string): Promise<NetworkContract[]> {
    const { value: contracts } = await this.get<Value<NetworkContract[]>>(
      `v1.0/tenants/${tenantId}/verifiableCredentialsNetwork/authorities/${issuerId}/contracts`,
    )
    return contracts
  }
}
