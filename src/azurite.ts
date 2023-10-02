import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import config from './config'

export async function initializeAzurite() {
  const { url, credential, logoImagesContainer } = config.get('blobStorage')
  if (!credential) throw new Error('No credential provided for azurite blob storage')
  const containerClient = new ContainerClient(
    [url, logoImagesContainer].join('/'),
    new StorageSharedKeyCredential(credential.accountName, credential.accountKey),
  )
  await containerClient.createIfNotExists({ access: 'blob' })
}
