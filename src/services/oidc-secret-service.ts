import { DefaultAzureCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'
import { environment, isLocalDev } from '@makerx/node-common'
import { oidcKeyVaultUrl, privateBlobStorage } from '../config'
import { logger } from '../logger'
import { invariant } from '../util/invariant'
import { Lazy } from '../util/lazy'
import { PrivateBlobStorageContainerService } from './private-blob-storage-container-service'

export interface OidcSecretService {
  getClientSecret(clientId: string): Promise<string | undefined>
  setClientSecret(clientId: string, secret: string): Promise<void>
  deleteClientSecret(clientId: string): Promise<void>
}

export function createOidcSecretService(): OidcSecretService {
  if (environment === 'test') throw new Error('OidcSecretService must be mocked under test')
  if (isLocalDev) return new OidcSecretBlobStorageService()
  invariant(oidcKeyVaultUrl, 'oidcKeyVaultUrl config is not set')
  return new OidcSecretKeyvaultService({
    vaultUrl: oidcKeyVaultUrl,
  })
}

class OidcSecretKeyvaultService implements OidcSecretService {
  constructor({ vaultUrl }: { vaultUrl: string }) {
    this.secretClient = Lazy(() => new SecretClient(vaultUrl, new DefaultAzureCredential()))
  }

  secretClient: () => SecretClient

  static secretName = (clientId: string): string => `oidc-client-secret-${clientId}`

  async getClientSecret(clientId: string): Promise<string | undefined> {
    try {
      const secret = await this.secretClient().getSecret(OidcSecretKeyvaultService.secretName(clientId))
      return secret.value
    } catch (error) {
      logger.error(`Failed to get client secret for ${clientId}`, { error })
      throw error
    }
  }

  async setClientSecret(clientId: string, secret: string): Promise<void> {
    try {
      await this.secretClient().setSecret(OidcSecretKeyvaultService.secretName(clientId), secret)
    } catch (error) {
      logger.info(`Failed to set client secret for ${clientId}, attempting to recover and re-use soft-deleted secret`, { error })
      try {
        const task = await this.secretClient().beginRecoverDeletedSecret(OidcSecretKeyvaultService.secretName(clientId))
        await task.pollUntilDone()
        await this.secretClient().setSecret(OidcSecretKeyvaultService.secretName(clientId), secret)
        return
      } catch (recoveryError) {
        logger.error(`Failed to recover and re-use soft-deleted client secret for ${clientId}`, { error, recoveryError })
      }
      throw error
    }
  }

  async deleteClientSecret(clientId: string): Promise<void> {
    try {
      const task = await this.secretClient().beginDeleteSecret(OidcSecretKeyvaultService.secretName(clientId))
      await task.pollUntilDone()
    } catch (error) {
      logger.error(`Failed to delete client secret for ${clientId}`, { error })
      throw error
    }
  }
}

class OidcSecretBlobStorageService extends PrivateBlobStorageContainerService implements OidcSecretService {
  constructor() {
    if (!['localdev', 'test'].includes(environment))
      throw new Error('OidcClientSecretBlobStorageService should only be used for localdev or under test')
    super({ containerName: privateBlobStorage.localdevClientSecretsContainer })
  }

  async getClientSecret(clientId: string): Promise<string | undefined> {
    const data = await this.downloadToBuffer(clientId)
    return data ? data.toString('utf-8') : undefined
  }

  async setClientSecret(clientId: string, secret: string): Promise<void> {
    await this.upload(clientId, Buffer.from(secret, 'utf-8'))
  }

  async deleteClientSecret(clientId: string): Promise<void> {
    await this.deleteIfExists(clientId)
  }
}
