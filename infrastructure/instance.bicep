@description('The resource prefix to use for all resources')
@minLength(3)
param resourcePrefix string

param location string = resourceGroup().location

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  name: '${resourcePrefix}-la'
}

resource apiAppInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourcePrefix}-api-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    DisableIpMasking: false
    Flow_Type: 'Bluefield'
    Request_Source: 'rest'
    RetentionInDays: 180
    SamplingPercentage: 100
    WorkspaceResourceId: logAnalytics.id
  }
}

var keyVaultProperties = {
  enabledForTemplateDeployment: true
  tenantId: subscription().tenantId
  accessPolicies: [
    {
      tenantId: subscription().tenantId
      objectId: apiAppService.identity.principalId
      permissions: {
        secrets: [
          'get'
        ]
      }
    }
  ]
  sku: {
    name: 'standard'
    family: 'A'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: 'vo-kv-inst-${uniqueSuffix}'
  location: location
  properties: keyVaultProperties
}

module keyVaultFirewall './keyvault-firewall.bicep' = {
  name: 'keyvault-firewall'
  params: {
    keyVaultName: keyVault.name
    keyVaultProperties: keyVaultProperties
    location: location
    ipAddresses: split(apiAppService.properties.outboundIpAddresses, ',')
  }
}

resource staticSiteKeyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: 'vo-kv-stat-${uniqueSuffix}'
  location: location
  properties: {
    enabledForTemplateDeployment: true
    tenantId: subscription().tenantId
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: docsSite.identity.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
    ]
    sku: {
      name: 'standard'
      family: 'A'
    }
  }
}

resource keyVaultDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diagnostics'
  scope: keyVault
  properties: {
    workspaceId: logAnalytics.id
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        timeGrain: null
      }
    ]
    logs: [
      {
        category: 'AuditEvent'
        enabled: true
      }
    ]
  }
}

@description('The cookie secret used by the cookie-session Express middleware')
@secure()
param apiCookieSecret string

resource apiCookieSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'API-COOKIE-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: apiCookieSecret
  }
}

@description('The client secret of the API app registration in Azure AD')
@secure()
param apiClientSecret string

resource apiClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'API-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: apiClientSecret
  }
}

@description('The client secret of the Internal app registration in Azure AD')
@secure()
param internalClientSecret string

resource internalClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'INTERNAL-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: internalClientSecret
  }
}

@description('The client secret of the VID callback app registration in Azure AD')
@secure()
param vidCallbackClientSecret string

resource vidCallbackClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'VID-CALLBACK-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: vidCallbackClientSecret
  }
}

@description('The client secret of the limited access client: anonymous presentations app registration in Azure AD')
@secure()
param limitedAccessClientSecret string

resource limitedAccessClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'LIMITED-ACCESS-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedAccessClientSecret
  }
}

@description('The secret for limited access client data keys')
@secure()
param limitedAccessSecret string

resource limitedAccessSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'LIMITED-ACCESS-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedAccessSecret
  }
}

@description('The client secret of the docs site app registration in Azure AD')
@secure()
param docsSiteClientSecret string
resource docsSiteClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'DOCS-SITE-CLIENT-SECRET'
  parent: staticSiteKeyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: docsSiteClientSecret
  }
}

@description('The ID of the VID authority')
@secure()
param vidAuthorityId string
resource vidAuthorityIdSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'VID-AUTHORITY-ID'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: vidAuthorityId
  }
}

@description('The instance, used to construct known URLs by convention')
param instance string
@description('The value to use for API cors.origin setting (RegExp string[] of additional origins)')
param corsOrigin string
@description('Mapping of identity issuer identifiers to labels (JSON Record<string, string>)')
param identityIssuers string
@description('Mapping of app user OIDs to labels (JSON Record<string, string>)')
param platformConsumerApps string
@description('The name of the home tenant')
param homeTenantName string
@description('The ID of the home tenant')
param homeTenantId string
@description('The client ID of the home tenant graph client (optional)')
param homeTenantGraphClientId string
@description('The client secret of the home tenant graph client (optional)')
@secure()
param homeTenantGraphClientSecret string
@description('The client ID of the home tenant VID service client (optional)')
param homeTenantVidServiceClientId string
@description('The client secret of the home tenant VID service client (optional)')
@secure()
param homeTenantVidServiceClientSecret string
@description('The flag indicating whether the dev tools (i.e. Apollo Sandbox, .etc) are deployed')
param devToolsEnabled string
resource homeTenantGraphClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'HOME-TENANT-GRAPH-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: homeTenantGraphClientSecret
  }
}
resource homeTenantVidServiceClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'HOME-TENANT-VID-SERVICE-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: homeTenantVidServiceClientSecret
  }
}

@description('Specify the pricing tier of the new Azure Redis Cache.')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param redisCacheSKU string

@description('Specify the family for the sku. C = Basic/Standard, P = Premium.')
@allowed([
  'C'
  'P'
])
param redisCacheFamily string

@description('Specify the size of the new Azure Redis Cache instance. Valid values: for C (Basic/Standard) family (0, 1, 2, 3, 4, 5, 6), for P (Premium) family (1, 2, 3, 4)')
@allowed([
  0
  1
  2
  3
  4
  5
  6
])
param redisCacheCapacity int

var uniqueSuffix = toLower(uniqueString(resourceGroup().id))

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: '${resourcePrefix}-redis-${uniqueSuffix}'
  location: location
  properties: {
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    sku: {
      capacity: redisCacheCapacity
      family: redisCacheFamily
      name: redisCacheSKU
    }
    redisConfiguration: {
      'maxmemory-policy': 'noeviction'
    }
  }
}

module redisCacheFirewall './redis-firewall.bicep' = {
  name: 'redis-firewall'
  params: {
    redisCacheName: redisCache.name
    ipAddresses: split(apiAppService.properties.outboundIpAddresses, ',')
  }
}

resource redisKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'REDIS-KEY'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: redisCache.listKeys().primaryKey
  }
}

resource redisCacheDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: redisCache
  name: 'diagnostics'
  properties: {
    workspaceId: logAnalytics.id
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        timeGrain: null
      }
    ]
  }
}

output databaseHost string = '${sqlServerName}${az.environment().suffixes.sqlServerHostname}'

resource verifiedOrchestrationStorage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: 'vo${uniqueSuffix}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_GRS'
  }
  properties: {
    allowBlobPublicAccess: true
    publicNetworkAccess: 'Enabled'
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      defaultAction: 'Allow'
    }
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  name: 'default'
  parent: verifiedOrchestrationStorage
  properties: {
    cors: {
      corsRules: [
        {
          allowedHeaders: [
            '*'
          ]
          allowedMethods: [
            'GET'
            'HEAD'
            'OPTIONS'
          ]
          allowedOrigins: [
            '*'
          ]
          exposedHeaders: [
            '*'
          ]
          maxAgeInSeconds: 86400
        }
      ]
    }
  }
}

resource logoImageContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: 'logo-images'
  parent: blobService
  properties: {
    publicAccess: 'Blob'
  }
}

@description('This is the built-in Storage Blob Data Contributor role. See https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-contributor')
resource storageBlobContributorRoleDefinition 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' existing = {
  scope: subscription()
  name: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: logoImageContainer
  name: guid(logoImageContainer.id, apiAppService.id, storageBlobContributorRoleDefinition.id)
  properties: {
    roleDefinitionId: storageBlobContributorRoleDefinition.id
    principalId: apiAppService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

@description('The ID of the app service plan to host instance app services')
param appServicePlanId string

resource apiAppService 'Microsoft.Web/sites@2022-03-01' = {
  name: '${resourcePrefix}-api-${uniqueSuffix}'
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      alwaysOn: true
      appCommandLine: 'pm2 start ./src/main.tracing.js -i max --no-daemon'
      ftpsState: 'Disabled'
      linuxFxVersion: 'NODE|20-lts'
      minTlsVersion: '1.2'
    }
  }
}

output apiAppServicePrincipalId string = apiAppService.identity.principalId
output apiAppServiceName string = apiAppService.name
output apiAppServiceDefaultHostname string = apiAppService.properties.defaultHostName
output apiAppServiceCustomDomainVerificationId string = apiAppService.properties.customDomainVerificationId

param sqlServerName string
param nodeEnv string

resource apiAppServiceConfig 'Microsoft.Web/sites/config@2022-03-01' = {
  name: 'appsettings'
  parent: apiAppService
  properties: {
    NODE_ENV: nodeEnv
    WEBSITE_RUN_FROM_PACKAGE: '1'
    APPINSIGHTS_INSTRUMENTATION_KEY: apiAppInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: apiAppInsights.properties.ConnectionString
    INSTANCE: instance
    CORS_ORIGIN: corsOrigin
    COOKIE_SECRET: '@Microsoft.KeyVault(SecretUri=${apiCookieSecretSecret.properties.secretUri})'
    DATABASE_HOST: '${sqlServerName}${az.environment().suffixes.sqlServerHostname}'
    DATABASE_NAME: '${resourcePrefix}-sql-db'
    REDIS_KEY: '@Microsoft.KeyVault(SecretUri=${redisKeySecret.properties.secretUri})'
    REDIS_HOST: '${redisCache.name}.redis.cache.windows.net'
    BLOB_STORAGE_URL: 'https://${verifiedOrchestrationStorage.name}.blob.${az.environment().suffixes.storage}'
    API_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${apiClientSecretSecret.properties.secretUri})'
    INTERNAL_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${internalClientSecretSecret.properties.secretUri})'
    VID_CALLBACK_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${vidCallbackClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAccessClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAccessSecretSecret.properties.secretUri})'
    HOME_TENANT_NAME: homeTenantName
    HOME_TENANT_ID: homeTenantId
    HOME_TENANT_GRAPH_CLIENT_ID: homeTenantGraphClientId
    HOME_TENANT_GRAPH_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${homeTenantGraphClientSecretSecret.properties.secretUri})'
    HOME_TENANT_VID_SERVICE_CLIENT_ID: homeTenantVidServiceClientId
    HOME_TENANT_VID_SERVICE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${homeTenantVidServiceClientSecretSecret.properties.secretUri})'
    VID_AUTHORITY_ID: '@Microsoft.KeyVault(SecretUri=${vidAuthorityIdSecret.properties.secretUri})'
    DEV_TOOLS_ENABLED: devToolsEnabled
    IDENTITY_ISSUERS: identityIssuers
    PLATFORM_CONSUMER_APPS: platformConsumerApps
  }
}

param sharedResourceGroupName string

module sqlServerFirewall './sql-firewall.bicep' = {
  name: 'sql-firewall'
  scope: resourceGroup(sharedResourceGroupName)
  params: {
    sqlServerName: sqlServerName
    ipAddresses: split(apiAppService.properties.outboundIpAddresses, ',')
    rulePrefix: 'AppService'
  }
}

resource docsSite 'Microsoft.Web/staticSites@2022-03-01' = {
  name: '${resourcePrefix}-docs-site'
  // Static Web Apps is a global service, but ARM only accepts a few locations
  // See https://learn.microsoft.com/en-us/azure/static-web-apps/faq#how-do-i-ensure-my-app-is-deployed-to-a-specific-azure-region-
  #disable-next-line no-hardcoded-location
  location: 'eastasia'
  sku: {
    name: 'Standard'
    size: 'Standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {}
}

output docsSiteName string = docsSite.name
output docsSiteDefaultHostname string = docsSite.properties.defaultHostname

@description('The client ID of the docs site app registration in Azure AD')
param docsSiteClientId string
resource docsSiteAppSettings 'Microsoft.Web/staticSites/config@2022-09-01' = {
  name: 'appsettings'
  kind: 'string'
  parent: docsSite
  properties: {
    AZURE_CLIENT_ID: docsSiteClientId
    AZURE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${docsSiteClientSecretSecret.properties.secretUri})'
  }
}
