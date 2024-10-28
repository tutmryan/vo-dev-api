import { DefaultAzureCredential } from '@azure/identity'
import type {
  BlobDeleteIfExistsResponse,
  BlobGetPropertiesResponse,
  BlobItem,
  BlobUploadCommonResponse,
  BlockBlobParallelUploadOptions,
} from '@azure/storage-blob'
import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import mime from 'mime-types'
import type { BlobStorageCredentials } from '../config'
import { parseDataUrl } from '../util/data-url'
import { Lazy } from '../util/lazy'

export class BlobStorageContainerService {
  constructor({ url, containerName, credentials }: { url: string; containerName: string; credentials?: BlobStorageCredentials }) {
    this.containerClient = Lazy(() => {
      const client = new ContainerClient(
        [url, containerName].join('/'),
        credentials ? new StorageSharedKeyCredential(credentials.accountName, credentials.accountKey) : new DefaultAzureCredential(),
      )
      return client
    })
  }

  containerClient: () => ContainerClient

  /**
   * Uploads a blob from a data URL, using the data URL encoding and mimetype (sets the blobHTTPHeaders.blobContentType property)
   * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
   * @param blobName The name of the blob to upload to the container
   * @param dataUrl The data URL content to upload. See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
   * @param options
   *  - appendExtension: If true, the extension of the data URL mimetype will be appended to the blob name
   * @returns The fully qualified URL of the blob that was uploaded, including the appended extension if appendExtension was true
   */
  async uploadDataUrl(blobName: string, dataUrl: string, options: { appendExtension?: boolean } = {}): Promise<string> {
    const { appendExtension = false } = options
    const { data, encoding, mimeType } = parseDataUrl(dataUrl)
    const name = appendExtension ? `${blobName}.${mime.extension(mimeType)}` : blobName
    await this.upload(name, Buffer.from(data, encoding), {
      blobHTTPHeaders: { blobContentType: mimeType },
    })
    return [this.containerClient().url, name].join('/')
  }

  async upload(blobName: string, buffer: Buffer, options?: BlockBlobParallelUploadOptions): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient().getBlockBlobClient(blobName)
    return blockBlobClient.uploadData(buffer, options)
  }

  async exists(blobName: string): Promise<boolean> {
    const blockBlobClient = this.containerClient().getBlockBlobClient(blobName)
    return blockBlobClient.exists()
  }

  async downloadToBuffer(blobName: string): Promise<Buffer | undefined> {
    const blockBlobClient = this.containerClient().getBlockBlobClient(blobName)
    return blockBlobClient.downloadToBuffer()
  }

  async deleteIfExists(blobName: string): Promise<BlobDeleteIfExistsResponse> {
    const blockBlobClient = this.containerClient().getBlockBlobClient(blobName)
    return blockBlobClient.deleteIfExists()
  }

  async getProperties(blobName: string): Promise<BlobGetPropertiesResponse | undefined> {
    const blockBlobClient = this.containerClient().getBlockBlobClient(blobName)
    return blockBlobClient.getProperties()
  }

  async listAllBlobsFlat(path?: string) {
    const blobs = this.containerClient().listBlobsFlat({ prefix: path })
    const all: BlobItem[] = []
    for await (const blob of blobs) {
      all.push(blob)
    }
    return all
  }
}
