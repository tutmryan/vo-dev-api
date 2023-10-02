import { DefaultAzureCredential } from '@azure/identity'
import type { BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import config from '../config'
import { parseDataUrl } from '../util/data-url'
import { Lazy } from '../util/lazy'

export class BlobStorageContainerService {
  constructor({ containerName }: { containerName: string }) {
    this.containerClient = Lazy(() => {
      const { url, credential } = config.get('blobStorage')
      const client = new ContainerClient(
        [url, containerName].join('/'),
        credential ? new StorageSharedKeyCredential(credential.accountName, credential.accountKey) : new DefaultAzureCredential(),
      )
      return client
    })
  }

  containerClient: () => ContainerClient

  /**
   * Uploads a blob from a data URL, using the data URL encoding and mimetype
   * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
   */
  async uploadDataUrl(blobName: string, dataUrl: string): Promise<void> {
    const { data, encoding, mimeType } = parseDataUrl(dataUrl)
    await this.upload(blobName, Buffer.from(data, encoding), {
      blobHTTPHeaders: { blobContentType: mimeType },
    })
  }

  async upload(blobName: string, buffer: Buffer, options?: BlockBlobParallelUploadOptions): Promise<void> {
    const blockBlobClient = this.containerClient().getBlockBlobClient(blobName)
    await blockBlobClient.uploadData(buffer, options)
  }

  async deleteIfExists(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient().getBlockBlobClient(blobName)
    await blockBlobClient.deleteIfExists()
  }
}
