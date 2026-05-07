import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { blobStorage, privateBlobStorage } from './config'

export async function initializeAzurite() {
  if (!blobStorage.credentials || !privateBlobStorage.credentials) throw new Error('No credential provided for azurite blob storage')

  const blobStorageClient = new ContainerClient(
    [blobStorage.url, blobStorage.logoImagesContainer].join('/'),
    new StorageSharedKeyCredential(blobStorage.credentials.accountName, blobStorage.credentials.accountKey),
  )
  await blobStorageClient.createIfNotExists()

  const asyncIssuanceBlobStorageClient = new ContainerClient(
    [privateBlobStorage.url, privateBlobStorage.asyncIssuanceContainer].join('/'),
    new StorageSharedKeyCredential(privateBlobStorage.credentials.accountName, privateBlobStorage.credentials.accountKey),
  )
  await asyncIssuanceBlobStorageClient.createIfNotExists()

  const oidcAccountsBlobStorageClient = new ContainerClient(
    [privateBlobStorage.url, privateBlobStorage.oidcContainer].join('/'),
    new StorageSharedKeyCredential(privateBlobStorage.credentials.accountName, privateBlobStorage.credentials.accountKey),
  )
  await oidcAccountsBlobStorageClient.createIfNotExists()

  const oidcSecretLocaldevBlobStorageClient = new ContainerClient(
    [privateBlobStorage.url, privateBlobStorage.localdevClientSecretsContainer].join('/'),
    new StorageSharedKeyCredential(privateBlobStorage.credentials.accountName, privateBlobStorage.credentials.accountKey),
  )
  await oidcSecretLocaldevBlobStorageClient.createIfNotExists()

  const presentationFlowBlobStorageClient = new ContainerClient(
    [privateBlobStorage.url, privateBlobStorage.presentationFlowContainer].join('/'),
    new StorageSharedKeyCredential(privateBlobStorage.credentials.accountName, privateBlobStorage.credentials.accountKey),
  )
  await presentationFlowBlobStorageClient.createIfNotExists()
}
