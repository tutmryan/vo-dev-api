import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { blobStorage, privateBlobStorage } from './config'

// @azure/storage-blob 12.29.1 defaults to API version 2025-11-05 which Azurite 3.x does not support.
// Pin each ContainerClient to 2024-11-04 (supported by Azurite 3.33+) at runtime so container
// creation succeeds without downgrading the SDK.
function pinAzuriteCompatibleVersion(client: ContainerClient): ContainerClient {
  ;(client as any).storageClientContext.version = '2024-11-04'
  return client
}

export async function initializeAzurite() {
  if (!blobStorage.credentials || !privateBlobStorage.credentials) throw new Error('No credential provided for azurite blob storage')

  const blobStorageClient = pinAzuriteCompatibleVersion(
    new ContainerClient(
      [blobStorage.url, blobStorage.logoImagesContainer].join('/'),
      new StorageSharedKeyCredential(blobStorage.credentials.accountName, blobStorage.credentials.accountKey),
    ),
  )
  await blobStorageClient.createIfNotExists()

  const asyncIssuanceBlobStorageClient = pinAzuriteCompatibleVersion(
    new ContainerClient(
      [privateBlobStorage.url, privateBlobStorage.asyncIssuanceContainer].join('/'),
      new StorageSharedKeyCredential(privateBlobStorage.credentials.accountName, privateBlobStorage.credentials.accountKey),
    ),
  )
  await asyncIssuanceBlobStorageClient.createIfNotExists()

  const oidcAccountsBlobStorageClient = pinAzuriteCompatibleVersion(
    new ContainerClient(
      [privateBlobStorage.url, privateBlobStorage.oidcContainer].join('/'),
      new StorageSharedKeyCredential(privateBlobStorage.credentials.accountName, privateBlobStorage.credentials.accountKey),
    ),
  )
  await oidcAccountsBlobStorageClient.createIfNotExists()

  const oidcSecretLocaldevBlobStorageClient = pinAzuriteCompatibleVersion(
    new ContainerClient(
      [privateBlobStorage.url, privateBlobStorage.localdevClientSecretsContainer].join('/'),
      new StorageSharedKeyCredential(privateBlobStorage.credentials.accountName, privateBlobStorage.credentials.accountKey),
    ),
  )
  await oidcSecretLocaldevBlobStorageClient.createIfNotExists()

  const presentationFlowBlobStorageClient = pinAzuriteCompatibleVersion(
    new ContainerClient(
      [privateBlobStorage.url, privateBlobStorage.presentationFlowContainer].join('/'),
      new StorageSharedKeyCredential(privateBlobStorage.credentials.accountName, privateBlobStorage.credentials.accountKey),
    ),
  )
  await presentationFlowBlobStorageClient.createIfNotExists()
}
