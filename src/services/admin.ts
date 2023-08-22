import type { HttpClientOptions } from '@makerx/node-common'
import { HttpClient, HttpResponseError } from '@makerx/node-common'
import { createHash } from 'crypto'
import type { Authority, NetworkContract, NetworkIssuer, NetworkIssuersWhere } from '../generated/graphql'
import { invariant } from '../util/invariant'
import type { Contract, CreateContractInput, Credential, UpdateContractInput } from './admin.types'

interface Value<T> {
  value: T
}

// keep an authority reference at the module level
// to avoid having to repeatedly load it
let authority: Authority | undefined = undefined

export class AdminService extends HttpClient {
  constructor(options: HttpClientOptions) {
    super(options)
  }

  async authorities(): Promise<Authority[]> {
    const { value: authorities } = await this.get<Value<Authority[]>>('verifiableCredentials/authorities')
    return authorities
  }

  async authorityById(id: string): Promise<Authority> {
    return this.get<Authority>(`verifiableCredentials/authorities/${id}`)
  }

  async createContract(input: CreateContractInput): Promise<Contract> {
    try {
      return await this.post<Contract>(`verifiableCredentials/authorities/${await this.authorityId()}/contracts`, { data: input })
    } catch (error: any) {
      const { message, ...rest } = error
      this.options.logger?.error('Error creating contract', { message, ...rest })
      this.throwBestResponseErrorInfo(error)
    }
  }

  async updateContract(contractId: string, input: UpdateContractInput): Promise<Contract> {
    // The service is case-sensitive on GUIDs, and we get the contract ID from SQL Server / mssql as uppercase, so
    // we need to lowercase it ourselves #prettylame
    try {
      return await this.patch<Contract>(
        `verifiableCredentials/authorities/${await this.authorityId()}/contracts/${contractId.toLowerCase()}`,
        {
          data: input,
        },
      )
    } catch (error: any) {
      const { message, ...rest } = error
      this.options.logger?.error('Error updating contract', { message, ...rest })
      this.throwBestResponseErrorInfo(error)
    }
  }

  async contracts(authorityId?: string): Promise<Contract[]> {
    const { value: contracts } = await this.get<Value<Contract[]>>(
      `verifiableCredentials/authorities/${authorityId ?? (await this.authorityId())}/contracts`,
    )
    return contracts
  }

  async contract(id: string): Promise<Contract | null> {
    return this.get<Contract>(`verifiableCredentials/authorities/${await this.authorityId()}/contracts/${id.toLowerCase()}`)
  }

  async authority(): Promise<Authority> {
    if (authority) return authority

    const { value: authorities } = await this.get<Value<Authority[]>>('verifiableCredentials/authorities')

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
      `verifiableCredentialsNetwork/authorities?filter=${encodeURIComponent(`linkeddomainurls like ${linkedDomainUrlsLike}`)}`,
    )
    return issuers
  }

  async networkContracts(tenantId: string, issuerId: string): Promise<NetworkContract[]> {
    const { value: contracts } = await this.get<Value<NetworkContract[]>>(
      `tenants/${tenantId}/verifiableCredentialsNetwork/authorities/${issuerId}/contracts`,
    )
    return contracts
  }

  async findCredential(contractId: string, claimValue: string): Promise<Credential | null> {
    // reference article on how to generate sha256 hash
    // https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/admin-api#search-credentials
    const contractIdLowerCase = contractId.toLowerCase()
    const indexClaimHash = createHash('sha256').update(`${contractIdLowerCase}${claimValue.toLowerCase()}`).digest('base64')

    const { value: credentials } = await this.get<Value<Credential[]>>(
      `verifiableCredentials/authorities/${await this.authorityId()}/contracts/${contractIdLowerCase}/credentials?filter=${encodeURIComponent(
        `indexclaimhash eq ${indexClaimHash}`,
      )}`,
    )
    const [first] = credentials
    invariant(first, 'Unable to find a credential when querying the Verified ID service')
    return first
  }

  async revokeCredential(contractId: string, credentialId: string): Promise<void> {
    try {
      await this.post<undefined>(
        `verifiableCredentials/authorities/${await this.authorityId()}/contracts/${contractId.toLowerCase()}/credentials/${credentialId}/revoke`,
        {},
      )
    } catch (error: any) {
      const { message, ...rest } = error
      this.options.logger?.error('Error revoking credential', { message, ...rest })
      this.throwBestResponseErrorInfo(error)
    }
  }

  private throwBestResponseErrorInfo(error: HttpResponseError): never {
    if (error instanceof HttpResponseError && error.responseInfo.responseJson)
      throw (error.responseInfo.responseJson as any).error ?? error.responseInfo.responseJson
    throw error
  }
}
