import { type BlobItem, type BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { randomUUID } from 'crypto'
import type { JWK } from 'jose'
import { exportJWK, generateKeyPair } from 'jose'
import { compact } from 'lodash'
import { privateBlobStorage } from '../config'
import type { PresentationLoginAccount } from '../features/oidc-provider/session'
import { logger } from '../logger'
import { invariant } from '../util/invariant'
import { PrivateBlobStorageContainerService } from './private-blob-storage-container-service'

const accountsFolder = 'accounts'
function accountPath(accountId: string) {
  return [accountsFolder, accountId].join('/')
}

const keysFolder = 'keys'
function keyPath(keyId: string) {
  return [keysFolder, keyId].join('/')
}

const keyDaysBeforeRotation = 7
const keyMillisecondsBeforeRotation = 1000 * 60 * 60 * 24 * keyDaysBeforeRotation

export class OidcStorageService extends PrivateBlobStorageContainerService {
  constructor() {
    super({ containerName: privateBlobStorage.oidcContainer })
  }

  async uploadAccount(accountId: string, data: PresentationLoginAccount, options?: BlockBlobParallelUploadOptions): Promise<void> {
    await this.upload(accountPath(accountId), Buffer.from(JSON.stringify(data), 'utf-8'), options)
  }

  async downloadAccount(accountId: string): Promise<PresentationLoginAccount | undefined> {
    const data = await this.downloadToBuffer(accountPath(accountId))
    if (!data) return undefined
    return JSON.parse(data.toString('utf-8'))
  }

  async deleteAccountIfExists(accountId: string) {
    return this.deleteIfExists(accountPath(accountId))
  }

  private async createNewKey() {
    const { privateKey } = await generateKeyPair('PS256', { modulusLength: 4096 })
    const jwk = await exportJWK(privateKey)
    await this.upload(keyPath(randomUUID()), Buffer.from(JSON.stringify(jwk), 'utf-8'))
  }

  private async listKeyBlobs() {
    const all = await this.listAllBlobsFlat(keysFolder)
    const newestToOldest = all.sort((a, b) => b.properties.lastModified.getTime() - a.properties.lastModified.getTime())
    return newestToOldest
  }

  private shouldRotateKey(blob: BlobItem) {
    return blob.properties.lastModified.getTime() < Date.now() - keyMillisecondsBeforeRotation
  }

  /***
   * Returns the existing OIDC keys, unless keys require initialization, in which case it returns undefined.
   */
  async loadExistingKeys(): Promise<JWK[] | undefined> {
    const blobs = await this.listKeyBlobs()
    const [newest, ...others] = blobs
    if (!newest) return undefined
    const needsRotation = this.shouldRotateKey(newest)
    if (needsRotation) return undefined
    const keys = await Promise.all(
      [newest, ...others].map(async (blob) => {
        const data = await this.downloadToBuffer(blob.name)
        if (!data) return undefined
        return JSON.parse(data.toString('utf-8')) as JWK
      }),
    )
    return compact(keys)
  }

  /**
   * Initializes OIDC keys:
   * - Creates the first key if there is none.
   * - Rotates keys when the most recent is more than 7 days old, retaining max 3 keys.
   *
   * !!Important!!: This method should not be called concurrently from multiple instances. It should only be run via a deduplicated background job.
   */
  async initialiseKeysFromDeduplicatedBackgroundJob() {
    const blobs = await this.listKeyBlobs()

    // create the first key if none exist
    if (blobs.length === 0) {
      logger.info('No OIDC keys found, creating the first key')
      await this.createNewKey()
      return
    }

    // determine whether rotation is necessary
    const [firstBlob, secondBlob, thirdBlob, ...oldBlobs] = blobs
    invariant(firstBlob, 'No OIDC key blobs found')
    const needsRotation = this.shouldRotateKey(firstBlob)

    // delete old blobs if necessary
    const blobsToDelete = compact(needsRotation ? [thirdBlob, ...oldBlobs] : oldBlobs)
    if (blobsToDelete.length > 0) {
      logger.info(`Deleting ${blobsToDelete.length} old OIDC keys`)
      await Promise.all(blobsToDelete.map((blob) => this.deleteIfExists(blob.name)))
    }

    // add a new key if we are rotating
    if (needsRotation) {
      logger.info(`Rotating OIDC keys: adding 1 new key and retaining ${compact([firstBlob, secondBlob]).length} most recent keys`)
      await this.createNewKey()
      return
    }

    logger.warn(`OIDC service initializeKeysFromBackgroundJob was called but no initialization was required`)
  }
}
