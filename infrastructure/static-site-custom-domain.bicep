@description('The name of the static site')
param staticSiteName string

@description('The custom domain')
param domain string

resource staticSite 'Microsoft.Web/staticSites@2022-03-01' existing = {
  name: staticSiteName
}

resource appCustomDomain 'Microsoft.Web/staticSites/customDomains@2022-09-01' = {
  name: domain
  parent: staticSite
  properties: {
    #disable-next-line BCP037
    isDefault: true
  }
}
