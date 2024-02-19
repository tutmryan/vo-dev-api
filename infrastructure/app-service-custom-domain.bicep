@description('The name of the app service')
param appServiceName string

@description('The custom domain')
param domain string

param location string = resourceGroup().location

resource appService 'Microsoft.Web/sites@2022-03-01' existing = {
  name: appServiceName
}

// create initially with SNI disabled, then enable SNI below
resource hostNameBindings 'Microsoft.Web/sites/hostNameBindings@2022-09-01' = {
  #disable-next-line use-parent-property
  name: '${appService.name}/${domain}'
  properties: {
    customHostNameDnsRecordType: 'CName'
    hostNameType: 'Verified'
    siteName: appServiceName
    sslState: 'Disabled'
  }
}

resource hostNameCertificate 'Microsoft.Web/certificates@2022-09-01' = {
  name: '${domain}-certificate'
  location: location
  dependsOn: [
    hostNameBindings
  ]
  properties: {
    canonicalName: domain
    serverFarmId: appService.properties.serverFarmId
  }
}

// we need to use a module to enable sni, as ARM forbids using resource with this same type-name combination twice in one deployment.
module functionAppCustomHostEnable './app-service-custom-domain-enable-sni.bicep' = {
  name: '${domain}-sni-enable'
  params: {
    name: '${appService.name}/${domain}'
    certificateThumbprint: hostNameCertificate.properties.thumbprint
  }
}
