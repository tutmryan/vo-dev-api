import { DefaultAzureCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'
import { environment, isLocalDev } from '@makerx/node-common'
import { privateBlobStorage } from '../config'
import { logger } from '../logger'
import { invariant } from '../util/invariant'
import { Lazy } from '../util/lazy'
import { PrivateBlobStorageContainerService } from './private-blob-storage-container-service'

export interface ClientSecretService {
  get(clientId: string): Promise<string | undefined>
  set(clientId: string, secret: string): Promise<void>
  delete(clientId: string): Promise<void>
}

interface BuildArgs {
  keyVaultUrl?: string
  name: string
}

export function buildClientSecretService(args: BuildArgs): ClientSecretService {
  if (environment === 'test') throw new Error('ClientSecretService must be mocked under test')
  if (isLocalDev) return new LocalBlobStorage()
  invariant(args.keyVaultUrl, 'keyVaultUrl config is not set')
  return new AzureKeyVault({ keyVaultUrl: args.keyVaultUrl, name: args.name })
}

class AzureKeyVault implements ClientSecretService {
  private readonly name: string
  private readonly secretClient: () => SecretClient

  constructor(private readonly args: Required<BuildArgs>) {
    this.name = args.name
    this.secretClient = Lazy(() => new SecretClient(args.keyVaultUrl, new DefaultAzureCredential()))
  }

  private secretName(clientId: string) {
    return `${this.args.name}-${clientId}`
  }

  async get(clientId: string): Promise<string | undefined> {
    const secretName = this.secretName(clientId)
    try {
      const secret = await this.secretClient().getSecret(secretName)
      return secret.value
    } catch (error) {
      logger.error(`Failed to get ${this.name} client secret for ${clientId}`, { error })
      throw error
    }
  }

  async set(clientId: string, secret: string): Promise<void> {
    const secretName = this.secretName(clientId)
    try {
      await this.secretClient().setSecret(secretName, secret)
    } catch (error) {
      logger.info(`Failed to set ${this.name} client secret for ${clientId}, attempting recovery of soft-deleted secret`, { error })
      try {
        const task = await this.secretClient().beginRecoverDeletedSecret(secretName)
        await task.pollUntilDone()
        await this.secretClient().setSecret(secretName, secret)
        return
      } catch (recoveryError) {
        logger.error(`Failed to recover ${this.name} soft-deleted client secret for ${clientId}`, {
          error,
          recoveryError,
        })
      }
      throw error
    }
  }

  async delete(clientId: string): Promise<void> {
    const secretName = this.secretName(clientId)
    try {
      const task = await this.secretClient().beginDeleteSecret(secretName)
      await task.pollUntilDone()
    } catch (error) {
      logger.error(`Failed to delete ${this.name} client secret for ${clientId}`, { error })
      throw error
    }
  }
}

class LocalBlobStorage extends PrivateBlobStorageContainerService implements ClientSecretService {
  constructor() {
    if (!['localdev', 'test'].includes(environment)) throw new Error('LocalBlobStorage should only be used for localdev or test')
    super({ containerName: privateBlobStorage.localdevClientSecretsContainer })
  }

  async get(clientId: string): Promise<string | undefined> {
    const data = await this.downloadToBuffer(clientId)
    return data ? data.toString('utf-8') : undefined
  }

  async set(clientId: string, secret: string): Promise<void> {
    await this.upload(clientId, Buffer.from(secret, 'utf-8'))
  }

  async delete(clientId: string): Promise<void> {
    await this.deleteIfExists(clientId)
  }
}
