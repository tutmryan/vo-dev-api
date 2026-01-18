param location string = resourceGroup().location

var uniqueSuffix = toLower(uniqueString(resourceGroup().id))

resource verifiedIdDomainVerificationStorage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: 'vodid${uniqueSuffix}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_GRS'
  }
  properties: {
    allowBlobPublicAccess: false
    publicNetworkAccess: 'Enabled'
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      defaultAction: 'Allow'
    }
    supportsHttpsTrafficOnly: true
  }
}

resource verifiedIdDomainVerificationStorageBlobService 'Microsoft.Storage/storageAccounts/blobServices@2025-06-01' = {
  name: 'default'
  parent: verifiedIdDomainVerificationStorage
  properties: {
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 28
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 28
    }
    isVersioningEnabled: true
  }
}

output storageAccountName string = verifiedIdDomainVerificationStorage.name
