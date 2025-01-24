import type { HttpClientOptions } from '@makerx/node-common'
import { HttpClient } from '@makerx/node-common'
import { createHash } from 'crypto'
import type { Authority, NetworkContract, NetworkIssuer, NetworkIssuersWhere } from '../../generated/graphql'
import { Lazy } from '../../util/lazy'
import type { Contract, CreateContractInput, Credential, UpdateContractInput } from './admin.types'
import { throwBestResponseErrorInfo } from './utils'

interface Value<T> {
  value: T
}

export class VerifiedIdAdminService extends HttpClient {
  constructor(
    options: HttpClientOptions,
    private authorityId: string,
  ) {
    super(options)
  }

  authority = Lazy(() => this.get<Authority>(`verifiableCredentials/authorities/${this.authorityId}`))

  async createContract(input: CreateContractInput): Promise<Contract> {
    try {
      return await this.post<Contract>(`verifiableCredentials/authorities/${this.authorityId}/contracts`, { data: input })
    } catch (error: any) {
      const { message, ...rest } = error
      this.options.logger?.error('Error creating contract', { message, ...rest })
      throwBestResponseErrorInfo(error)
    }
  }

  async updateContract(contractId: string, input: UpdateContractInput): Promise<Contract> {
    try {
      return await this.patch<Contract>(`verifiableCredentials/authorities/${this.authorityId}/contracts/${contractId}`, {
        data: input,
      })
    } catch (error: any) {
      const { message, ...rest } = error
      this.options.logger?.error('Error updating contract', { message, ...rest })
      throwBestResponseErrorInfo(error)
    }
  }

  async contracts(): Promise<Contract[]> {
    const { value: contracts } = await this.get<Value<Contract[]>>(`verifiableCredentials/authorities/${this.authorityId}/contracts`)
    return contracts
  }

  async contract(id: string): Promise<Contract | null> {
    return this.get<Contract>(`verifiableCredentials/authorities/${this.authorityId}/contracts/${id}`)
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

  async findCredential(contractId: string, claimValue: string): Promise<Credential | undefined> {
    // reference article on how to generate sha256 hash
    // https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/admin-api#search-credentials
    const contractIdLowerCase = contractId.toLowerCase()
    const indexClaimHash = createHash('sha256').update(`${contractIdLowerCase}${claimValue.toLowerCase()}`).digest('base64')

    const { value: credentials } = await this.get<Value<Credential[]>>(
      `verifiableCredentials/authorities/${this.authorityId}/contracts/${contractIdLowerCase}/credentials?filter=${encodeURIComponent(
        `indexclaimhash eq ${indexClaimHash}`,
      )}`,
    )
    const [first] = credentials
    return first
  }

  async revokeCredential(contractId: string, credentialId: string): Promise<void> {
    try {
      await this.post<undefined>(
        `verifiableCredentials/authorities/${this.authorityId}/contracts/${contractId.toLowerCase()}/credentials/${credentialId}/revoke`,
        {},
      )
    } catch (error: any) {
      const { message, ...rest } = error
      this.options.logger?.error('Error revoking credential', { message, ...rest })
      throwBestResponseErrorInfo(error)
    }
  }
}
