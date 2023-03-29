import type { HttpClientOptions } from '@makerxstudio/node-common'
import { HttpClient } from '@makerxstudio/node-common'
import type { BaseContext } from '../context'
import { invariant } from '../util/invariant'
import type { Contract, CreateContractInput, UpdateContractInput } from './admin.types'

interface Value<T> {
  value: T
}

type Authority = {
  id: string
}

// This is a hacky way of not having to hit the /authorities
// endpoint every time to get the ID of the first one.
let authorityId: string | undefined = undefined

export class AdminService extends HttpClient<BaseContext> {
  constructor(options: HttpClientOptions<BaseContext>) {
    super(options)
  }

  async createContract(input: CreateContractInput): Promise<Contract> {
    const authorityId = await this.getAuthorityId()

    return await this.post<Contract>(`v1.0/verifiableCredentials/authorities/${authorityId}/contracts`, { data: input })
  }

  async updateContract(contractId: string, input: UpdateContractInput): Promise<Contract> {
    const authorityId = await this.getAuthorityId()

    // The service is case-sensitive on GUIDs, and we get the contract ID from SQL Server / mssql as uppercase, so
    // we need to lowercase it ourselves #prettylame
    return await this.patch<Contract>(`v1.0/verifiableCredentials/authorities/${authorityId}/contracts/${contractId.toLowerCase()}`, {
      data: input,
    })
  }

  private async getAuthorityId(): Promise<string> {
    if (authorityId) {
      return authorityId
    }

    const { value: authorities } = await this.get<Value<Authority[]>>('v1.0/verifiableCredentials/authorities')

    const [firstAuthority] = authorities
    invariant(firstAuthority, 'Unable to find an authority when querying the Verified ID service')

    authorityId = firstAuthority.id
    return authorityId
  }
}
