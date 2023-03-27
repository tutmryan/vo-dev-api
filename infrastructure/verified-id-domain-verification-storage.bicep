@description('The name of the storage account')
param storageAccountName string

param location string = resourceGroup().location

resource verifiedIdDomainVerificationStorage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
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

resource verifiedIdDomainVerificationStorageBlobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
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
