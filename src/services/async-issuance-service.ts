import type { BlobDeleteIfExistsResponse, BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { privateBlobStorage } from '../config'
import type { AsyncIssuanceRequestInput } from '../generated/graphql'
import { AsyncIssuanceRequestExpiry } from '../generated/graphql'
import { invariant } from '../util/invariant'
import { PrivateBlobStorageContainerService } from './private-blob-storage-container-service'

// folders MUST match lifecycle policy in Azure Blob Storage defined in: infrastructure/instance.bicep
const folders: Record<AsyncIssuanceRequestExpiry, string> = {
  [AsyncIssuanceRequestExpiry.OneDay]: '1-days',
  [AsyncIssuanceRequestExpiry.ThreeDays]: '3-days',
  [AsyncIssuanceRequestExpiry.OneWeek]: '7-days',
  [AsyncIssuanceRequestExpiry.TwoWeeks]: '14-days',
  [AsyncIssuanceRequestExpiry.OneMonth]: '30-days',
  [AsyncIssuanceRequestExpiry.ThreeMonths]: '90-days',
}

function path(id: string, expiry: AsyncIssuanceRequestExpiry) {
  const folder = folders[expiry]
  invariant(folder, `There is no folder configured for expiry ${expiry}`)
  return [folder, id.toUpperCase()].join('/')
}

export class AsyncIssuanceService extends PrivateBlobStorageContainerService {
  constructor() {
    super({ containerName: privateBlobStorage.asyncIssuanceContainer })
  }

  async uploadAsyncIssuance(id: string, data: AsyncIssuanceRequestInput, options?: BlockBlobParallelUploadOptions): Promise<void> {
    await this.upload(path(id, data.expiry), Buffer.from(JSON.stringify(data), 'utf-8'), options)
  }

  async downloadAsyncIssuance(id: string, expiry: AsyncIssuanceRequestExpiry): Promise<AsyncIssuanceRequestInput | undefined> {
    const data = await this.downloadToBuffer(path(id, expiry))
    if (!data) return undefined
    return JSON.parse(data.toString('utf-8'))
  }

  async deleteAsyncIssuanceIfExists(id: string, expiry: AsyncIssuanceRequestExpiry): Promise<BlobDeleteIfExistsResponse> {
    return this.deleteIfExists(path(id, expiry))
  }
}
