@description('The name of the app service')
param appServiceName string

@description('The custom domain')
param domain string

@description('Set to true when the domain has not yet been registered or does not have TLS enabled')
param isNewDomain bool

param location string = resourceGroup().location

resource appService 'Microsoft.Web/sites@2025-03-01' existing = {
  name: appServiceName
}

// Step 1: Register the custom hostname on the App Service (no SSL)
// Only runs on first deployment — re-running would strip the existing TLS binding
resource hostNameBinding 'Microsoft.Web/sites/hostNameBindings@2025-03-01' = if (isNewDomain) {
  parent: appService
  name: domain
  properties: {
    customHostNameDnsRecordType: 'CName'
    hostNameType: 'Verified'
    siteName: appServiceName
  }
}

// Step 2: Create managed certificate (requires hostname to be registered first)
resource hostNameCertificate 'Microsoft.Web/certificates@2025-03-01' = {
  name: '${domain}-certificate'
  location: location
  dependsOn: isNewDomain ? [hostNameBinding] : []
  properties: {
    canonicalName: domain
    serverFarmId: appService.properties.serverFarmId
  }
}

// Step 3: Update the hostname binding to enable SNI SSL with the certificate
module sslBinding 'app-service-custom-domain-ssl.bicep' = if (isNewDomain) {
  name: '${domain}-ssl-binding'
  params: {
    appServiceName: appServiceName
    domain: domain
    thumbprint: hostNameCertificate.properties.thumbprint
  }
}
