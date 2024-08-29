@description('The list of IP addresses to allow to access the key vault')
param ipAddresses array
@description('The name of the key vault')
param keyVaultName string
@description('The properties of the key vault')
param keyVaultProperties object

param location string = resourceGroup().location

// Check if CIDR notation is present, add /32 if not
var ipsWithCidr = [for ip in ipAddresses: contains(ip, '/') ? ip : '${ip}/32']
var ipRules = [for ipAddress in ipsWithCidr: { value: ipAddress }]

resource keyVaultIPAddress 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  properties: union(keyVaultProperties, {
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Deny'
      virtualNetworkRules: []
      ipRules: ipRules
    }
  })
}
