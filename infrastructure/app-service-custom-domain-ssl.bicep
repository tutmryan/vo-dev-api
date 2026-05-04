@description('The name of the app service')
param appServiceName string

@description('The custom domain')
param domain string

@description('The certificate thumbprint')
param thumbprint string

resource appService 'Microsoft.Web/sites@2025-03-01' existing = {
  name: appServiceName
}

resource hostNameBindings 'Microsoft.Web/sites/hostNameBindings@2025-03-01' = {
  parent: appService
  name: domain
  properties: {
    customHostNameDnsRecordType: 'CName'
    hostNameType: 'Verified'
    siteName: appServiceName
    sslState: 'SniEnabled'
    thumbprint: thumbprint
  }
}
