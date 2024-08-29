import type { BlobUploadCommonResponse, BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { BlobStorageContainerService } from './blob-storage-container-service'

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { privateBlobStorage } from '../config'
import { invariant } from '../util/invariant'

const algorithm = 'aes-256-ctr'
const randomIv = () => randomBytes(16)
invariant(privateBlobStorage.clientEncryptionKey, 'Private storage client encryption key is not configured')
const key = Buffer.from(privateBlobStorage.clientEncryptionKey, 'hex')

function encrypt(buffer: Buffer, iv: Buffer) {
  const cipher = createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(buffer)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return encrypted
}

function decrypt(buffer: Buffer, iv: Buffer) {
  const decipher = createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(buffer)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted
}

export class PrivateBlobStorageContainerService extends BlobStorageContainerService {
  constructor({ containerName }: { containerName: string }) {
    super({ url: privateBlobStorage.url, containerName, credentials: privateBlobStorage.credentials })
  }

  override async upload(blobName: string, buffer: Buffer, options?: BlockBlobParallelUploadOptions): Promise<BlobUploadCommonResponse> {
    const iv = randomIv()
    return super.upload(blobName, encrypt(buffer, iv), { metadata: { ...options?.metadata, iv: iv.toString('hex') }, ...options })
  }

  override async downloadToBuffer(blobName: string): Promise<Buffer | undefined> {
    const encrypted = await super.downloadToBuffer(blobName)
    if (!encrypted) return undefined
    const props = await this.getProperties(blobName)
    if (!props?.metadata?.iv) return undefined
    return decrypt(encrypted, Buffer.from(props.metadata.iv, 'hex'))
  }
}
