@description('Object ID of the service principal performing the deployment')
param servicePrincipalObjectId string

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

resource eventHubNamespace 'Microsoft.EventHub/namespaces@2022-10-01-preview' = {
  name: '${resourcePrefix}-eventhub-namespace'
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
  name: '${resourcePrefix}-eh-app-traces'
  parent: eventHubNamespace
  properties: {
    partitionCount: 4
    retentionDescription: {
      cleanupPolicy: 'Delete'
      retentionTimeInHours: 168
    }
  }
}

resource appTracesEventHubRule 'Microsoft.EventHub/namespaces/eventhubs/authorizationRules@2022-10-01-preview' = {
  name: '${resourcePrefix}-extract-app-traces-job-policy'
  parent: appTracesEventHub
  properties: {
    rights: [
      'Listen'
    ]
  }
}

resource appTracesEventHubConsumerGroups 'Microsoft.EventHub/namespaces/eventhubs/consumergroups@2022-10-01-preview' = {
  name: '${resourcePrefix}-extract-audit-traces-job-consumer-group'
  parent: appTracesEventHub
}

resource appTracesDataExport 'Microsoft.OperationalInsights/workspaces/dataExports@2020-08-01' = {
  name: '${resourcePrefix}-ehr-export-app-traces'
  parent: logAnalytics
  properties: {
    destination: {
      resourceId: eventHubNamespace.id
      metaData: {
        eventHubName: appTracesEventHub.name
      }
    }
    enable: true
    tableNames: [
      'AppTraces'
    ]
  }
}

resource auditTracesEventHub 'Microsoft.EventHub/namespaces/eventhubs@2023-01-01-preview' = {
  name: '${resourcePrefix}-eh-audit-traces'
  parent: eventHubNamespace
  properties: {
    partitionCount: 2
    retentionDescription: {
      cleanupPolicy: 'Delete'
      retentionTimeInHours: 168
    }
  }
}

resource auditTracesEventHubRule 'Microsoft.EventHub/namespaces/eventhubs/authorizationRules@2022-10-01-preview' = {
  name: '${resourcePrefix}-extract-audit-traces-job-policy'
  parent: auditTracesEventHub
  properties: {
    rights: [
      'Send'
      'Listen'
    ]
  }
}

resource extractAuditTracesJob 'Microsoft.StreamAnalytics/streamingjobs@2021-10-01-preview' = {
  name: '${resourcePrefix}-stream-job-extract-audit-traces'
  location: location
  properties: {
    sku: {
      name: 'StandardV2'
    }
    eventsLateArrivalMaxDelayInSeconds: 5
    eventsOutOfOrderMaxDelayInSeconds: 5
    eventsOutOfOrderPolicy: 'Adjust'
    outputErrorPolicy: 'Stop'
    jobType: 'Cloud'
    inputs: [
      {
        name: 'eh-app-traces'
        properties: {
          type: 'Stream'
          serialization: {
            type: 'Json'
            properties: {
              encoding: 'UTF8'
            }
          }
          datasource: {
            type: 'Microsoft.EventHub/EventHub'
            properties: {
              serviceBusNamespace: eventHubNamespace.name
              sharedAccessPolicyName: '${resourcePrefix}-extract-app-traces-job-policy'
              sharedAccessPolicyKey: appTracesEventHubRule.listKeys().primaryKey
              eventHubName: appTracesEventHub.name
              consumerGroupName: '${resourcePrefix}-extract-audit-traces-job-consumer-group'
            }
          }
        }
      }
    ]
    outputs: [
      {
        name: 'eh-audit-traces'
        properties: {
          serialization: {
            type: 'Json'
            properties: {
              encoding: 'UTF8'
            }
          }
          datasource: {
            type: 'Microsoft.EventHub/EventHub'
            properties: {
              serviceBusNamespace: eventHubNamespace.name
              sharedAccessPolicyName: '${resourcePrefix}-extract-audit-traces-job-policy'
              sharedAccessPolicyKey: auditTracesEventHubRule.listKeys().primaryKey
              eventHubName: auditTracesEventHub.name
              authenticationMode: 'ConnectionString'
            }
          }
        }
      }
    ]
    outputStartMode: 'JobStartTime'
    transformation: {
      name: 'unwrap-traces-filter-audits'
      properties: {
        query: '''
        WITH logs AS (
          SELECT data.arrayvalue as log
          FROM [eh-app-traces]
          CROSS APPLY GetArrayElements(records) AS data
        )
        SELECT *
        INTO [eh-audit-traces]
        FROM logs
        WHERE log.Properties.logLevel = 'audit'
        '''
      }
    }
  }
}

resource extractAuditTracesJobDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diagnostics'
  scope: extractAuditTracesJob
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
        category: null
        categoryGroup: 'allLogs'
        enabled: true
      }
    ]
  }
}

var keyVaultName = '${resourcePrefix}-kv'

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
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: docsSiteClientSecret
  }
}

@description('The ID of the VID authority')
param vidAuthorityId string
@description('The name of the home tenant')
param homeTenantName string
@description('The ID of the home tenant')
param homeTenantId string
@description('The client ID of the home tenant graph client (optional)')
param homeTenantGraphClientId string
@description('The client secret home tenant graph client (optional)')
@secure()
param homeTenantGraphClientSecret string
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
  name: '${resourcePrefix}-redis'
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

output databaseHost string = '${sqlServerName}${az.environment().suffixes.sqlServerHostname}'

resource verifiedOrchestrationStorage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: replace('${resourcePrefix}-storage', '-', '')
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
  name: '${resourcePrefix}-api'
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
    COOKIE_SECRET: '@Microsoft.KeyVault(SecretUri=${apiCookieSecretSecret.properties.secretUri})'
    DATABASE_HOST: '${sqlServerName}${az.environment().suffixes.sqlServerHostname}'
    DATABASE_NAME: '${resourcePrefix}-sql-db'
    REDIS_KEY: '@Microsoft.KeyVault(SecretUri=${redisKeySecret.properties.secretUri})'
    REDIS_HOST: '${redisCache.name}.redis.cache.windows.net'
    BLOB_STORAGE_URL: 'https://${verifiedOrchestrationStorage.name}.blob.${az.environment().suffixes.storage}'
    API_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${apiClientSecretSecret.properties.secretUri})'
    VID_CALLBACK_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${vidCallbackClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAccessClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAccessSecretSecret.properties.secretUri})'
    HOME_TENANT_NAME: homeTenantName
    HOME_TENANT_ID: homeTenantId
    HOME_TENANT_GRAPH_CLIENT_ID: homeTenantGraphClientId
    HOME_TENANT_GRAPH_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${homeTenantGraphClientSecretSecret.properties.secretUri})'
    VID_AUTHORITY_ID: vidAuthorityId
  }
}

resource docsSiteWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
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
