@description('Environment the resources are deployed in')
@allowed([
  'dev'
])
param environment string

@description('Object ID of the service principal performing the deployment')
param servicePrincipalObjectId string

var resourcePrefix = 'vo'
var appName = 'verified-orchestration'

param location string = resourceGroup().location

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${resourcePrefix}-${environment}-${appName}-la'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 180
  }
}

resource apiAppInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourcePrefix}-${environment}-${appName}-api-ai'
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

resource eventHubNamespace 'Microsoft.EventHub/namespaces@2022-10-01-preview' = {
  name: '${resourcePrefix}-${environment}-${appName}-eventhub-ns'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
    capacity: 1
  }
  properties: {
    isAutoInflateEnabled: true
    maximumThroughputUnits: 20
    minimumTlsVersion: '1.2'
  }
}

resource appTracesEventHub 'Microsoft.EventHub/namespaces/eventhubs@2023-01-01-preview' = {
  name: '${resourcePrefix}-${environment}-${appName}-app-traces-eh'
  parent: eventHubNamespace
  properties: {
    partitionCount: 1
    retentionDescription: {
      cleanupPolicy: 'Delete'
      retentionTimeInHours: 168
    }
  }
}

var keyVaultName = '${resourcePrefix}-${environment}-vrfd-orchstn-kv'

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  properties: {
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
      {
        tenantId: subscription().tenantId
        objectId: migrationsFunctionApp.identity.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
      {
        tenantId: subscription().tenantId
        objectId: docsSiteWebApp.identity.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
      {
        tenantId: subscription().tenantId
        objectId: servicePrincipalObjectId
        permissions: {
          secrets: [
            'get'
            'set'
            'list'
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

@description('The client secret of the UI app registration in Azure AD')
@secure()
param uiClientSecret string

resource uiClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'UI-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: uiClientSecret
  }
}

@description('The client secret of the API integration app registration in the B2C tenant')
@secure()
param b2cGraphClientSecret string

resource b2cGraphClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'B2C-GRAPH-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: b2cGraphClientSecret
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

@description('API key for SendGrid')
@secure()
param sendgridApiKey string

resource sendgridApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'SENDGRID-API-KEY'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: sendgridApiKey
  }
}

@description('The client secret of the docs site app registration in Azure AD')
@secure()
param docsSiteClientSecret string
resource docsSiteClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'DOCS-SITE-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: docsSiteClientSecret
  }
}

@description('Name of the Azure SQL AAD administrator')
param sqlInstanceAadAdministratorName string

@description('Object ID of the Azure SQL AAD administrator')
param sqlInstanceAadAdministratorObjectId string

resource sqlInstance 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: '${resourcePrefix}-${environment}-${appName}-sql'
  location: location
  properties: {
    administratorLogin: 'vo-admin'
    administratorLoginPassword: guid(resourceGroup().id)
    administrators: {
      administratorType: 'ActiveDirectory'
      login: sqlInstanceAadAdministratorName
      sid: sqlInstanceAadAdministratorObjectId
      tenantId: subscription().tenantId
    }
  }
}

resource sqlInstanceAllowAzureWorkloadsFirewallRule 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  name: 'AllowAllWindowsAzureIps'
  parent: sqlInstance
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

@description('Name of the Azure SQL database')
param sqlDatabaseName string

@description('Pricing tier of the Azure SQL database')
param sqlDatabaseSku string

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  name: sqlDatabaseName
  location: location
  parent: sqlInstance
  sku: {
    name: sqlDatabaseSku
  }
}

// https://docs.microsoft.com/en-us/azure/templates/microsoft.insights/2021-05-01-preview/diagnosticsettings?pivots=deployment-language-bicep
resource sqlDatabaseDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diagnostics'
  scope: sqlDatabase
  properties: {
    workspaceId: logAnalytics.id
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        timeGrain: null
      }
    ]
    // https://docs.microsoft.com/en-us/azure/azure-monitor/essentials/resource-logs-categories#microsoftsqlserversdatabases
    logs: [
      {
        category: 'SQLInsights'
        enabled: true
      }
      {
        category: 'Errors'
        enabled: true
      }
    ]
  }
}

@description('Specify the name of the Azure Redis Cache to create.')
param redisCacheName string

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

resource redisCache 'Microsoft.Cache/Redis@2020-06-01' = {
  name: redisCacheName
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

@description('App Service Plan SKU')
@allowed([
  'B1'
  'B2'
  'B3'
  'D1'
  'F1'
  'FREE'
  'I1'
  'I1v2'
  'I2'
  'I2v2'
  'I3'
  'I3v2'
  'I4v2'
  'I5v2'
  'I6v2'
  'P0V3'
  'P1MV3'
  'P1V2'
  'P1V3'
  'P2MV3'
  'P2V2'
  'P2V3'
  'P3MV3'
  'P3V2'
  'P3V3'
  'P4MV3'
  'P5MV3'
  'S1'
  'S2'
  'S3'
  'SHARED'
  'WS1'
  'WS2'
  'WS3'
])
param appServicePlanSku string

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${resourcePrefix}-${environment}-${appName}-plan'
  location: location
  sku: {
    name: appServicePlanSku
    capacity: 2
  }
  properties: {
    reserved: true
  }
}

resource apiAppService 'Microsoft.Web/sites@2022-03-01' = {
  name: '${resourcePrefix}-${environment}-${appName}-api'
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      alwaysOn: true
      appCommandLine: 'pm2 start ./src/main.tracing.js -i max --no-daemon'
      ftpsState: 'Disabled'
      linuxFxVersion: 'NODE|18-lts'
      minTlsVersion: '1.2'
    }
  }
}

resource apiAppServiceConfig 'Microsoft.Web/sites/config@2022-03-01' = {
  name: 'appsettings'
  parent: apiAppService
  properties: {
    APPINSIGHTS_INSTRUMENTATION_KEY: apiAppInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: apiAppInsights.properties.ConnectionString
    COOKIE_SECRET: '@Microsoft.KeyVault(SecretUri=${apiCookieSecretSecret.properties.secretUri})'
    DATABASE_HOST: '${sqlInstance.name}${az.environment().suffixes.sqlServerHostname}'
    NODE_ENV: environment
    WEBSITE_RUN_FROM_PACKAGE: '1'
    API_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${apiClientSecretSecret.properties.secretUri})'
    UI_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${uiClientSecretSecret.properties.secretUri})'
    B2C_GRAPH_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${b2cGraphClientSecretSecret.properties.secretUri})'
    VID_CALLBACK_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${vidCallbackClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAccessClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAccessSecretSecret.properties.secretUri})'
    REDIS_KEY: '@Microsoft.KeyVault(SecretUri=${redisKeySecret.properties.secretUri})'
    SENDGRID_API_KEY: '@Microsoft.KeyVault(SecretUri=${sendgridApiKeySecret.properties.secretUri})'
  }
}

resource verifiedOrchestrationStorage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: '${resourcePrefix}${environment}vrfdorchstnst'
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

// Instead of automating this, we will use the Azure portal to assign the role to the service principal
// see ../docs/infrastructure/manual-steps.md
// This approach avoids granting role assignment permissions to the deployment service principal
//
// @description('This is the built-in Storage Blob Data Contributor role. See https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-contributor')
// resource storageBlobContributorRoleDefinition 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' existing = {
//   scope: subscription()
//   name: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
// }

// resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
//   scope: logoImageContainer
//   name: guid(logoImageContainer.id, apiAppService.id, storageBlobContributorRoleDefinition.id)
//   properties: {
//     roleDefinitionId: storageBlobContributorRoleDefinition.id
//     principalId: apiAppService.identity.principalId
//     principalType: 'ServicePrincipal'
//   }
// }

resource migrationsStorageSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'MIGRATIONS-STORAGE-CONNECTION-STRING'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: 'DefaultEndpointsProtocol=https;AccountName=${verifiedOrchestrationStorage.name};AccountKey=${verifiedOrchestrationStorage.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
  }
}

resource migrationsAppInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourcePrefix}-${environment}-${appName}-migrations-ai'
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

resource migrationsFunctionApp 'Microsoft.Web/sites@2022-03-01' = {
  name: '${resourcePrefix}-${environment}-${appName}-migrations'
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      alwaysOn: true
      ftpsState: 'Disabled'
      linuxFxVersion: 'Node|18'
      minTlsVersion: '1.2'
    }
  }
}

@description('A unique version number that is returned by the GetVersion function of the migrations Function app')
param migrationsAppVersion string

resource migrationsFunctionAppConfig 'Microsoft.Web/sites/config@2022-03-01' = {
  name: 'appsettings'
  parent: migrationsFunctionApp
  properties: {
    APPINSIGHTS_INSTRUMENTATION_KEY: migrationsAppInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: migrationsAppInsights.properties.ConnectionString
    AzureWebJobsStorage: '@Microsoft.KeyVault(SecretUri=${migrationsStorageSecret.properties.secretUri})'
    FUNCTIONS_EXTENSION_VERSION: '~4'
    FUNCTIONS_WORKER_RUNTIME: 'node'
    WEBSITE_RUN_FROM_PACKAGE: '1'
    NODE_ENV: environment
    DATABASE_HOST: '${sqlInstance.name}${az.environment().suffixes.sqlServerHostname}'
    DATABASE_PORT: '1433'
    APP_VERSION: migrationsAppVersion
  }
}

@description('The client ID of the migrations app registration in Azure AD')
param migrationsAppClientId string

@description('The client ID of the deployment app registration in Azure AD')
param deploymentAppClientId string

resource migrationsFunctionAppAuthConfig 'Microsoft.Web/sites/config@2022-03-01' = {
  name: 'authsettingsV2'
  parent: migrationsFunctionApp
  properties: {
    platform: {
      enabled: true
    }
    globalValidation: {
      requireAuthentication: true
      unauthenticatedClientAction: 'Return401'
    }
    httpSettings: {
      requireHttps: true
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          clientId: migrationsAppClientId
          #disable-next-line no-hardcoded-env-urls
          openIdIssuer: 'https://login.microsoftonline.com/${subscription().tenantId}/v2.0/'
        }
        validation: {
          defaultAuthorizationPolicy: {
            allowedApplications: [
              deploymentAppClientId
            ]
          }
        }
      }

      apple: { enabled: false }
      azureStaticWebApps: { enabled: false }
      facebook: { enabled: false }
      gitHub: { enabled: false }
      google: { enabled: false }
      legacyMicrosoftAccount: { enabled: false }
      twitter: { enabled: false }
    }
  }
}

resource docsSiteWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: '${resourcePrefix}-${environment}-${appName}-docs-site'
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

@description('The client ID of the docs site app registration in Azure AD')
param docsSiteClientId string
resource docsSiteWebAppAppSettings 'Microsoft.Web/staticSites/config@2022-09-01' = {
  name: 'appsettings'
  kind: 'string'
  parent: docsSiteWebApp
  properties: {
    AZURE_CLIENT_ID: docsSiteClientId
    AZURE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${docsSiteClientSecretSecret.properties.secretUri})'
  }
}

output docsSiteWebAppName string = docsSiteWebApp.name
