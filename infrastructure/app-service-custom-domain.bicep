@description('The name of the app service')
param appServiceName string

@description('The custom domain')
param domain string

param location string = resourceGroup().location

resource appService 'Microsoft.Web/sites@2025-03-01' existing = {
  name: appServiceName
}

// Create managed certificate for the custom domain
resource hostNameCertificate 'Microsoft.Web/certificates@2025-03-01' = {
  name: '${domain}-certificate'
  location: location
  properties: {
    canonicalName: domain
    serverFarmId: appService.properties.serverFarmId
  }
}

// Create hostname binding with SNI enabled using the certificate
resource hostNameBindings 'Microsoft.Web/sites/hostNameBindings@2025-03-01' = {
  parent: appService
  name: domain
  properties: {
    customHostNameDnsRecordType: 'CName'
    hostNameType: 'Verified'
    siteName: appServiceName
    sslState: 'SniEnabled'
    thumbprint: hostNameCertificate.properties.thumbprint
  }
}
