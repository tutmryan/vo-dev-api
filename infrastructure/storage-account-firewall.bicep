@description('The list of IP addresses to allow to access the storage account')
param ipAddresses array
@description('The name of the storage account')
param storageAccountName string
@description('The identity of the storage account')
param storageAccountIdentity object
@description('The properties of the storage account')
param storageAccountProperties object
@description('The kind of storage account to create')
param storageAccountKind 'BlobStorage' | 'BlockBlobStorage' | 'FileStorage' | 'Storage' | 'StorageV2' = 'StorageV2'
@description('The SKU of the storage account')
param storageAccountSkuName
  | 'Premium_LRS'
  | 'Premium_ZRS'
  | 'Standard_GRS'
  | 'Standard_GZRS'
  | 'Standard_LRS'
  | 'Standard_RAGRS'
  | 'Standard_RAGZRS'
  | 'Standard_ZRS' = 'Standard_GRS'
@description('The identity type of the storage account')
param location string = resourceGroup().location

var ipRules = [for ipAddress in ipAddresses: { value: ipAddress, action: 'Allow' }]

resource storageAccountIPAddress 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  kind: storageAccountKind
  sku: {
    name: storageAccountSkuName
  }
  identity: storageAccountIdentity
  properties: union(storageAccountProperties, {
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Deny'
      ipRules: ipRules
      virtualNetworkRules: []
      resourceAccessRules: []
    }
  })
}
