import { type BlobItem, type BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import * as asn1js from 'asn1js'
import { randomUUID, subtle } from 'crypto'
import { addYears } from 'date-fns'
import type { JWK } from 'jose'
import { exportJWK } from 'jose'
import { compact } from 'lodash'
import * as pkijs from 'pkijs'
import { apiUrl, privateBlobStorage } from '../config'
import type { PresentationLoginAccount } from '../features/oidc-provider/session'
import { logger } from '../logger'
import { invariant } from '../util/invariant'
import { Lazy } from '../util/lazy'
import { throwError } from '../util/throw-error'
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

const cryptoEngine = Lazy(() => {
  pkijs.setEngine('node', new pkijs.CryptoEngine({ name: 'node', crypto: crypto }))
  return pkijs.getCrypto(true)
})

/*
 * Convert a PEM-encoded certificate to the version used in the x5c element
 * of a [JSON Web Key](http://tools.ietf.org/html/draft-ietf-jose-json-web-key).
 *
 * `cert` PEM-encoded certificate chain
 * `maxDepth` The maximum number of certificates to use from the chain.
 */
function convertPemCertToX5c(cert: string, maxDepth: number = 0) {
  cert = cert.replace(/-----[^\n]+\n?/gm, ',').replace(/\n/g, '')
  let certs = cert.split(',').filter(function (c) {
    return c.length > 0
  })
  if (maxDepth > 0) {
    certs = certs.splice(0, maxDepth)
  }
  return certs
}

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
    // PS256, aka RSASSA-PSS, is a probabilistic signature scheme the same JWT will produce different signatures each time it is signed.
    // Note: RSA PKCS#1 v1.5 is not recommended for new applications.
    // Note: Another option is ES256, aka ECDSA using P-256 and SHA-256, which is faster and produces smaller signatures.
    // However, it is less widely supported and given speed of generation is not a concern, we're using PS256.
    const alg = 'PS256'
    const keyUsages = ['sign', 'verify'] satisfies KeyUsage[]
    // Extractable is required to export the private key as a JWK
    const extractable = true
    const now = new Date()
    const engine = cryptoEngine()

    const { publicKey, privateKey } = await subtle.generateKey(
      {
        name: 'RSA-PSS',
        // 256-bit hash at 50% output gives 2^128 hashes before collision (https://en.wikipedia.org/wiki/Birthday_attack)
        hash: `SHA-${alg.slice(-3)}`,
        // The public exponent is a Fermat prime (2^2^n + 1) where n is a non-negative integer. (https://en.wikipedia.org/wiki/Fermat_number#Primality)
        // The fourth Fermat number 2^16 + 1 = 65537 is the most common value for the public exponent, as it offers a balance between security and performance.
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        // https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/ism/cyber-security-guidelines/guidelines-cryptography
        // A modulus of 2048 bits for correctly implemented RSA provides 112 bits of effective security strength. Taking into account projected technological advances,
        // it is assessed that 112 bits of effective security strength will remain secure until 2030.
        // We're using 4096 bits to be extra safe, whilst not going overboard or causing performance issues.
        modulusLength: 4096,
      },
      extractable,
      keyUsages,
    )

    // Create a Certificate object & set certificate fields (Ref: https://www.rfc-editor.org/rfc/rfc5280#section-4.1.2.2)
    const certificate = new pkijs.Certificate()
    // This field describes the version of the encoded certificate.
    // The latest version is 3, which includes support for extension.
    certificate.version = 2 // Zero-based index
    // The serial number MUST be a positive integer assigned by the CA to each certificate.
    // Certificate users MUST be able to handle serialNumber values up to 20 octets.
    // Conforming CAs MUST NOT use serialNumber values longer than 20 octets.
    // Max number=2^160-1 (2^(20*8)-1), Max number returned by getTime() is 2^53-1 (Number.MAX_SAFE_INTEGER)
    // So, we can safely use the current time in milliseconds as the serial number.
    certificate.serialNumber = new asn1js.Integer({ value: now.getTime() })
    // Both notBefore and notAfter may be encoded as UTCTime or GeneralizedTime.
    certificate.notBefore.value = now
    // The certificate is valid for 1 year
    certificate.notAfter.value = addYears(now, 1)

    // Type refs: https://learn.microsoft.com/en-us/windows/win32/seccrypto/name-properties
    const names = [
      // Common name
      new pkijs.AttributeTypeAndValue({
        type: '2.5.4.3',
        value: new asn1js.Utf8String({ value: apiUrl }),
      }),
    ]
    certificate.subject.typesAndValues = names
    certificate.issuer.typesAndValues = names

    // Import the public key into the certificate, so we can sign it
    await certificate.subjectPublicKeyInfo.importKey(publicKey)

    // Sign the certificate using the private key
    await certificate.sign(privateKey, 'SHA-256', engine)

    // Export the certificate to PEM format
    const certBuffer = certificate.toSchema(true).toBER(false)
    const pemCert = `-----BEGIN CERTIFICATE-----\n${Buffer.from(certBuffer).toString('base64')}\n-----END CERTIFICATE-----`

    const jwk = await exportJWK(privateKey)
    // Add the certificate chain to the JWK
    jwk.x5c = convertPemCertToX5c(pemCert)

    await this.upload(keyPath(randomUUID()), Buffer.from(JSON.stringify(jwk), 'utf-8'))
  }

  private async listKeyBlobs() {
    const all = await this.listAllBlobsFlat(keysFolder)
    const newestToOldest = all.sort((a, b) => b.properties.lastModified.getTime() - a.properties.lastModified.getTime())
    return newestToOldest
  }

  private shouldRotateKey(newestKeyBlob: BlobItem) {
    return newestKeyBlob.properties.lastModified.getTime() < Date.now() - keyMillisecondsBeforeRotation
  }

  /***
   * Returns the existing OIDC keys, unless keys require initialization, in which case it returns undefined.
   */
  async loadExistingKeys(): Promise<{ jwk: JWK; createdOn: Date }[] | undefined> {
    const blobs = await this.listKeyBlobs()
    const [newest, ...others] = blobs
    if (!newest) return undefined
    const needsRotation = this.shouldRotateKey(newest)
    if (needsRotation) return undefined
    const keys = await Promise.all(
      [newest, ...others].map(async (blob) => {
        const data = await this.downloadToBuffer(blob.name)
        if (!data) return undefined
        return {
          jwk: JSON.parse(data.toString('utf-8')) as JWK,
          createdOn: blob.properties.createdOn ?? throwError('Failed to get createdOn date for OIDC key from blog storage'),
        }
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

    logger.warn(`OIDC service initialiseKeysFromDeduplicatedBackgroundJob was called but no initialisation was required`)
  }
}
