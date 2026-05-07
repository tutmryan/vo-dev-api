@description('The resource prefix to use for all resources')
@minLength(3)
param resourcePrefix string

@description('The ID of the deployment service principal')
param deploymentServicePrincipalObjectId string

@description('The ID of the platform management service principal')
param platformManagementServicePrincipalObjectId string

@description('The number of days to retain data in App Insights')
@minValue(30)
@maxValue(365)
param appInsightsRetentionInDays int = 180

param location string = resourceGroup().location

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2025-07-01' existing = {
  name: '${resourcePrefix}-la'
}

resource auditTracesDataCollectionRule 'Microsoft.Insights/dataCollectionRules@2024-03-11' existing = {
  name: '${resourcePrefix}-dcr-audit-traces'
}

resource auditTracesDataCollectionEndpoint 'Microsoft.Insights/dataCollectionEndpoints@2024-03-11' existing = {
  name: '${resourcePrefix}-dce-audit-traces'
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
    RetentionInDays: appInsightsRetentionInDays
    SamplingPercentage: 100
    WorkspaceResourceId: logAnalytics.id
  }
}

param vnetName string
// subnet ids
var privateEndpointsSubnetId = resourceId(
  sharedResourceGroupName,
  'Microsoft.Network/virtualNetworks/subnets',
  vnetName,
  'private-endpoints-subnet'
)
var appServiceSubnetId = resourceId(
  sharedResourceGroupName,
  'Microsoft.Network/virtualNetworks/subnets',
  vnetName,
  'app-service-subnet'
)

resource keyVault 'Microsoft.KeyVault/vaults@2025-05-01' = {
  name: 'vo-kv-inst-${uniqueSuffix}'
  location: location
  properties: {
    enabledForTemplateDeployment: true
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    enablePurgeProtection: true
    publicNetworkAccess: 'Disabled'
    accessPolicies: [
      // DO NOT, under any circumstances, enable reading of Key Vault secrets
      // Only the API app service should have access, and only via application settings that are keyvault secret references
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
        objectId: privateStorageUserAssignedIdentity.properties.principalId
        permissions: {
          keys: [
            'unwrapKey'
            'wrapKey'
            'get'
          ]
        }
      }
      {
        tenantId: subscription().tenantId
        objectId: deploymentServicePrincipalObjectId
        permissions: {
          secrets: [
            'list'
          ]
        }
      }
      {
        tenantId: subscription().tenantId
        objectId: platformManagementServicePrincipalObjectId
        permissions: {
          secrets: [
            'set'
          ]
        }
      }
    ]
  }
}

resource oidcKeyVault 'Microsoft.KeyVault/vaults@2025-05-01' = {
  name: 'vo-kv-oidc-${uniqueSuffix}'
  location: location
  properties: {
    enabledForTemplateDeployment: true
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    enablePurgeProtection: true
    publicNetworkAccess: 'Disabled'
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: apiAppService.identity.principalId
        permissions: {
          secrets: [
            'get'
            'set'
            'delete'
            'recover'
          ]
        }
      }
    ]
  }
}

resource identityStoreKeyVault 'Microsoft.KeyVault/vaults@2025-05-01' = {
  name: 'vo-kv-idst-${uniqueSuffix}'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    enabledForTemplateDeployment: true
    enablePurgeProtection: true
    publicNetworkAccess: 'Disabled'
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: apiAppService.identity.principalId
        permissions: {
          secrets: [
            'get'
            'set'
            'delete'
            'recover'
          ]
        }
      }
    ]
  }
}

resource keyVaultPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-10-01' = {
  name: '${resourcePrefix}-kv-pe'
  location: location
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${resourcePrefix}-kv-private-link'
        properties: {
          privateLinkServiceId: keyVault.id
          groupIds: ['vault']
        }
      }
    ]
  }
}

resource oidcKeyVaultPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-10-01' = {
  name: '${resourcePrefix}-oidc-kv-pe'
  location: location
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${resourcePrefix}-oidc-kv-private-link'
        properties: {
          privateLinkServiceId: oidcKeyVault.id
          groupIds: ['vault']
        }
      }
    ]
  }
}

resource identityStoreKvPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-10-01' = {
  name: '${resourcePrefix}-identity-store-kv-pe'
  location: location
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${resourcePrefix}-identity-store-kv-private-link'
        properties: {
          privateLinkServiceId: identityStoreKeyVault.id
          groupIds: ['vault']
        }
      }
    ]
  }
}

resource keyVaultPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2025-01-01' = {
  parent: keyVaultPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: resourceId(
            sharedResourceGroupName,
            'Microsoft.Network/privateDnsZones',
            'privatelink.vaultcore.azure.net'
          )
        }
      }
    ]
  }
}

resource oidcKeyVaultPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2025-01-01' = {
  parent: oidcKeyVaultPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: resourceId(
            sharedResourceGroupName,
            'Microsoft.Network/privateDnsZones',
            'privatelink.vaultcore.azure.net'
          )
        }
      }
    ]
  }
}

resource identityStoreKeyVaultPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2025-01-01' = {
  parent: identityStoreKvPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: resourceId(
            sharedResourceGroupName,
            'Microsoft.Network/privateDnsZones',
            'privatelink.vaultcore.azure.net'
          )
        }
      }
    ]
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

resource apiCookieSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = if (!empty(apiCookieSecret)) {
  name: 'API-COOKIE-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: apiCookieSecret
  }
}

resource apiCookieSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2025-05-01' existing = if (empty(apiCookieSecret)) {
  name: 'API-COOKIE-SECRET'
  parent: keyVault
}

@description('The SMS credential secret')
@secure()
param smsSecret string

resource smsSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'SMS-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: smsSecret
  }
}

@description('The SMS primary token')
@secure()
param smsPrimaryToken string

resource smsPrimaryTokenSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'SMS-PRIMARY-TOKEN'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: smsPrimaryToken
  }
}

@description('The email API key')
@secure()
param emailApiKey string

resource emailApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'EMAIL-API-KEY'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: emailApiKey
  }
}

@description('The email webhook forwarder secret')
@secure()
param emailWebhookForwarderSecret string

resource emailWebhookForwarderSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'EMAIL-WEBHOOK-FORWARDER-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: emailWebhookForwarderSecret
  }
}

@description('The client secret of the API app registration in Azure AD')
@secure()
param apiClientSecret string

resource apiClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = if (!empty(apiClientSecret)) {
  name: 'API-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: apiClientSecret
  }
}

resource apiClientSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2025-05-01' existing = if (empty(apiClientSecret)) {
  name: 'API-CLIENT-SECRET'
  parent: keyVault
}

@description('The client secret of the Internal app registration in Azure AD')
@secure()
param internalClientSecret string

resource internalClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
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

resource vidCallbackClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
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

resource limitedAccessClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'LIMITED-ACCESS-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedAccessClientSecret
  }
}

@description('The secret for limited access data keys')
@secure()
param limitedAccessSecret string

resource limitedAccessSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = if (!empty(limitedAccessSecret)) {
  name: 'LIMITED-ACCESS-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedAccessSecret
  }
}

resource limitedAccessSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2025-05-01' existing = if (empty(limitedAccessSecret)) {
  name: 'LIMITED-ACCESS-SECRET'
  parent: keyVault
}

@description('The client secret of the limited presentation flow client')
@secure()
param limitedPresentationFlowClientSecret string

resource limitedPresentationFlowClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'LIMITED-PRESENTATION-FLOW-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedPresentationFlowClientSecret
  }
}

@description('The secret for limited presentation flow data keys')
@secure()
param limitedPresentationFlowSecret string

resource limitedPresentationFlowSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = if (!empty(limitedPresentationFlowSecret)) {
  name: 'LIMITED-PRESENTATION-FLOW-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedPresentationFlowSecret
  }
}

resource limitedPresentationFlowSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2025-05-01' existing = if (empty(limitedPresentationFlowSecret)) {
  name: 'LIMITED-PRESENTATION-FLOW-SECRET'
  parent: keyVault
}

@description('The client secret of the limited photo capture client')
@secure()
param limitedPhotoCaptureClientSecret string

resource limitedPhotoCaptureClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'LIMITED-PHOTO-CAPTURE-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedPhotoCaptureClientSecret
  }
}

@description('The secret for limited photo capture data keys')
@secure()
param limitedPhotoCaptureSecret string

resource limitedPhotoCaptureSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = if (!empty(limitedPhotoCaptureSecret)) {
  name: 'LIMITED-PHOTO-CAPTURE-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedPhotoCaptureSecret
  }
}

resource limitedPhotoCaptureSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2025-05-01' existing = if (empty(limitedPhotoCaptureSecret)) {
  name: 'LIMITED-PHOTO-CAPTURE-SECRET'
  parent: keyVault
}

@description('The client secret of the limited async issuance client')
@secure()
param limitedAsyncIssuanceClientSecret string

resource limitedAsyncIssuanceClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'LIMITED-ASYNC-ISSUANCE-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedAsyncIssuanceClientSecret
  }
}

@description('The secret for limited async issuance data keys')
@secure()
param limitedAsyncIssuanceSecret string

resource limitedAsyncIssuanceSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = if (!empty(limitedAsyncIssuanceSecret)) {
  name: 'LIMITED-ASYNC-ISSUANCE-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedAsyncIssuanceSecret
  }
}

resource limitedAsyncIssuanceSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2025-05-01' existing = if (empty(limitedAsyncIssuanceSecret)) {
  name: 'LIMITED-ASYNC-ISSUANCE-SECRET'
  parent: keyVault
}

@description('The client secret of the limited demo client in Azure AD')
@secure()
param limitedDemoClientSecret string

resource limitedDemoClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'LIMITED-DEMO-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedDemoClientSecret
  }
}

@description('The client secret of the limited OIDC client')
@secure()
param limitedOidcClientSecret string

resource limitedOidcClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'LIMITED-OIDC-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedOidcClientSecret
  }
}

@description('The secret for limited OIDC data keys')
@secure()
param limitedOidcSecret string

resource limitedOidcSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = if (!empty(limitedOidcSecret)) {
  name: 'LIMITED-OIDC-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedOidcSecret
  }
}

resource limitedOidcSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2025-05-01' existing = if (empty(limitedOidcSecret)) {
  name: 'LIMITED-OIDC-SECRET'
  parent: keyVault
}

@description('The ID of the VID authority')
@secure()
param vidAuthorityId string

resource vidAuthorityIdSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
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

@description('The release version of the instance')
param releaseVersion string

@description('The domain, used to construct known URLs by convention')
param domain string

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

@description('The client ID of the home tenant VID service client (optional)')
param homeTenantVidServiceClientId string

@description('The client secret of the home tenant VID service client (optional)')
@secure()
param homeTenantVidServiceClientSecret string

@description('The flag indicating whether the dev tools (i.e. Apollo Studio, .etc) are deployed')
param devToolsEnabled string

@description('The flag indicating whether the face check features (i.e. issuing credentials with face check photo, .etc) are available')
param faceCheckEnabled string

@description('The flag indicating whether the demo features (i.e limited presentation token, presentation demo page, .etc) are deployed')
param demoEnabled string

@description('The flag indicating whether the mDoc presentation features are available')
param mdocPresentationsEnabled string

@description('The flag indicating whether multipaz test certificates are enabled for mDoc')
param mdocMultipazTestCertificatesEnabled string

@description('JWT tokens issued by these tenant IDs are accepted by API in addition to the home tenant and platform tenant')
param additionalAuthTenantIds string

@description('Limit the number of aliases in a GraphQL document.')
param graphqlMaxAliases string

@description('Limit the depth of a GraphQL document.')
param graphqlMaxDepth string

@description('Limit the number of directives in a GraphQL document.')
param graphqlMaxDirectives string

@description('Limit the number of tokens in a GraphQL document.')
param graphqlMaxTokens string

@description('The log level of the API app')
param logLevel string

resource homeTenantVidServiceClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'HOME-TENANT-VID-SERVICE-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: homeTenantVidServiceClientSecret
  }
}

@description('Specify the SKU for the Managed Redis (Redis Enterprise) instance.')
@allowed([
  'MemoryOptimized_M10'
  'MemoryOptimized_M20'
  'MemoryOptimized_M50'
  'MemoryOptimized_M100'
  'ComputeOptimized_X5'
  'ComputeOptimized_X10'
  'ComputeOptimized_X20'
  'Balanced_B0'
  'Balanced_B1'
  'Balanced_B3'
  'Balanced_B5'
  'Balanced_B10'
  'Balanced_B20'
])
param managedRedisSKU string = 'Balanced_B0'

var uniqueSuffix = toLower(uniqueString(resourceGroup().id))
var managedRedisUniqueSuffix = substring(uniqueSuffix, 0, 8)

@description('The shared action group for alerts, if action group for alerts has not been set up yet this param value will be empty')
param actionGroupAlertName string

var actionGroupAlertId = resourceId(sharedResourceGroupName, 'Microsoft.Insights/actionGroups', actionGroupAlertName)

// Managed Redis (Redis Enterprise) resources
resource managedRedis 'Microsoft.Cache/redisEnterprise@2024-09-01-preview' = {
  name: '${resourcePrefix}-mgd-redis-${managedRedisUniqueSuffix}'
  location: location
  sku: {
    name: managedRedisSKU
  }
  properties: {
    minimumTlsVersion: '1.2'
  }
}

resource managedRedisDatabase 'Microsoft.Cache/redisEnterprise/databases@2024-09-01-preview' = {
  parent: managedRedis
  name: 'default'
  properties: {
    clientProtocol: 'Encrypted'
    evictionPolicy: 'AllKeysLRU'
    clusteringPolicy: 'EnterpriseCluster'
    port: 10000
  }
}

resource managedRedisPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-10-01' = {
  name: '${resourcePrefix}-mgd-redis-pe'
  location: location
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${resourcePrefix}-mgd-redis-private-link'
        properties: {
          privateLinkServiceId: managedRedis.id
          groupIds: ['redisEnterprise']
        }
      }
    ]
  }
}

resource managedRedisCachePrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2025-01-01' = {
  parent: managedRedisPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: resourceId(
            sharedResourceGroupName,
            'Microsoft.Network/privateDnsZones',
            'privatelink.redis.azure.net'
          )
        }
      }
    ]
  }
}

resource managedRedisKeySecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = {
  name: 'MANAGED-REDIS-KEY'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    #disable-next-line BCP422
    value: managedRedisDatabase.listKeys().primaryKey
  }
}

// Managed Redis metric alerts
var managedRedisAlerts = [
  {
    nameSuffix: 'memory'
    description: 'Managed Redis used memory is high'
    metricName: 'usedmemorypercentage'
    aggregation: 'Maximum'
    threshold: 80
    useDynamicThreshold: false
    alertSensitivity: null
    failingPeriods: null
    severity: 0
    evaluationFrequency: 'PT1M'
  }
  {
    nameSuffix: 'cpu'
    description: 'Managed Redis CPU usage is high'
    metricName: 'percentProcessorTime'
    aggregation: 'Average'
    threshold: 80
    useDynamicThreshold: false
    alertSensitivity: null
    failingPeriods: null
    severity: 1
    evaluationFrequency: 'PT5M'
  }
  {
    nameSuffix: 'server-load'
    description: 'Managed Redis server load is high'
    metricName: 'serverLoad'
    aggregation: 'Average'
    threshold: 80
    useDynamicThreshold: false
    alertSensitivity: null
    failingPeriods: null
    severity: 1
    evaluationFrequency: 'PT5M'
  }
  {
    nameSuffix: 'clients'
    description: 'Managed Redis connected clients is high'
    metricName: 'connectedclients'
    aggregation: 'Maximum'
    threshold: 5625
    useDynamicThreshold: false
    alertSensitivity: null
    failingPeriods: null
    severity: 1
    evaluationFrequency: 'PT5M'
  }
]

resource managedRedisMetricAlerts 'Microsoft.Insights/metricAlerts@2018-03-01' = [
  for alert in managedRedisAlerts: if (!empty(actionGroupAlertName)) {
    name: '${resourcePrefix}-mgd-redis-${alert.nameSuffix}-alert'
    location: 'global'
    properties: {
      description: alert.description
      severity: alert.severity
      enabled: true
      scopes: [
        managedRedis.id
      ]
      evaluationFrequency: alert.evaluationFrequency
      windowSize: 'PT5M'
      criteria: alert.useDynamicThreshold
        ? {
            allOf: [
              {
                name: alert.metricName
                criterionType: 'DynamicThresholdCriterion'
                metricNamespace: 'Microsoft.Cache/redisEnterprise'
                metricName: alert.metricName
                operator: 'GreaterThan'
                alertSensitivity: alert.alertSensitivity!
                failingPeriods: alert.failingPeriods!
                timeAggregation: alert.aggregation
                skipMetricValidation: false
              }
            ]
            'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
          }
        : {
            allOf: [
              {
                name: alert.metricName
                criterionType: 'StaticThresholdCriterion'
                metricNamespace: 'Microsoft.Cache/redisEnterprise'
                metricName: alert.metricName
                operator: 'GreaterThan'
                threshold: alert.threshold!
                timeAggregation: alert.aggregation
                skipMetricValidation: false
              }
            ]
            'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
          }
      autoMitigate: true
      targetResourceType: 'Microsoft.Cache/redisEnterprise'
      targetResourceRegion: location
      actions: [
        {
          actionGroupId: actionGroupAlertId
        }
      ]
    }
  }
]

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

resource verifiedOrchestrationStorageLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'DeleteLock'
  scope: verifiedOrchestrationStorage
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevent accidental deletion of verified orchestration storage account'
  }
}

resource verifiedOrchestrationStorageBlobService 'Microsoft.Storage/storageAccounts/blobServices@2025-06-01' = {
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
    deleteRetentionPolicy: {
      enabled: true
      days: 8
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 8
    }
    restorePolicy: {
      enabled: true
      days: 7
    }
    changeFeed: {
      enabled: true
      retentionInDays: 7
    }
    isVersioningEnabled: true
  }
}

resource logoImageContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: 'logo-images'
  parent: verifiedOrchestrationStorageBlobService
  properties: {
    publicAccess: 'Blob'
  }
}

@description('This is the built-in Storage Blob Data Contributor role. See https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-contributor')
resource storageBlobContributorRoleDefinition 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' existing = {
  scope: subscription()
  name: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
}

resource logoImagesContainerRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: logoImageContainer
  name: guid(logoImageContainer.id, apiAppService.id, storageBlobContributorRoleDefinition.id)
  properties: {
    roleDefinitionId: storageBlobContributorRoleDefinition.id
    principalId: apiAppService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource privateStorageUserAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${resourcePrefix}-private-storage-identity-${uniqueSuffix}'
  location: location
}

resource privateStorageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: 'voprivate${uniqueSuffix}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_GRS'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${privateStorageUserAssignedIdentity.id}': {}
    }
  }
  properties: {
    allowBlobPublicAccess: false
    publicNetworkAccess: 'Disabled'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowSharedKeyAccess: false
    encryption: {
      services: {
        blob: {
          enabled: true
        }
      }
      identity: {
        userAssignedIdentity: privateStorageUserAssignedIdentity.id
      }
      keySource: 'Microsoft.Keyvault'
      keyvaultproperties: {
        keyname: privateStorageEncryptionKey.name
        keyvaulturi: endsWith(keyVault.properties.vaultUri, '/')
          ? substring(keyVault.properties.vaultUri, 0, max(length(keyVault.properties.vaultUri) - 1, 0))
          : keyVault.properties.vaultUri
      }
    }
  }
}

resource privateStorageAccountLock 'Microsoft.Authorization/locks@2020-05-01' = {
  name: 'DeleteLock'
  scope: privateStorageAccount
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevent accidental deletion of private storage account'
  }
}

resource privateStorageEncryptionKey 'Microsoft.KeyVault/vaults/keys@2021-10-01' = {
  parent: keyVault
  name: 'private-storage-key'
  properties: {
    attributes: {
      enabled: true
    }
    keySize: 4096
    kty: 'RSA'
  }
}

@description('The key for encrypting private storage data')
@secure()
param privateStorageClientEncryptionKey string

resource privateStorageClientEncryptionKeySecret 'Microsoft.KeyVault/vaults/secrets@2025-05-01' = if (!empty(privateStorageClientEncryptionKey)) {
  name: 'PRIVATE-STORAGE-ENCRYPTION-KEY'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: privateStorageClientEncryptionKey
  }
}

resource privateStorageClientEncryptionKeySecretExisting 'Microsoft.KeyVault/vaults/secrets@2025-05-01' existing = if (empty(privateStorageClientEncryptionKey)) {
  name: 'PRIVATE-STORAGE-ENCRYPTION-KEY'
  parent: keyVault
}

resource verifiedOrchestrationPrivateStorageBlobService 'Microsoft.Storage/storageAccounts/blobServices@2025-06-01' = {
  name: 'default'
  parent: privateStorageAccount
  properties: {
    lastAccessTimeTrackingPolicy: {
      enable: true
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 8
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 8
    }
    restorePolicy: {
      enabled: true
      days: 7
    }
    changeFeed: {
      enabled: true
      retentionInDays: 7
    }
    isVersioningEnabled: true
  }
}

resource storagePrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-10-01' = {
  name: '${resourcePrefix}-storage-pe'
  location: location
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${resourcePrefix}-storage-private-link'
        properties: {
          privateLinkServiceId: privateStorageAccount.id
          groupIds: ['blob']
        }
      }
    ]
  }
}

resource storagePrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2025-01-01' = {
  parent: storagePrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: resourceId(
            sharedResourceGroupName,
            'Microsoft.Network/privateDnsZones',
            'privatelink.blob.${environment().suffixes.storage}'
          )
        }
      }
    ]
  }
}

resource asyncIssuanceBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: 'async-issuance'
  parent: verifiedOrchestrationPrivateStorageBlobService
  properties: {
    publicAccess: 'None'
  }
}

resource oidcBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: 'oidc'
  parent: verifiedOrchestrationPrivateStorageBlobService
  properties: {
    publicAccess: 'None'
  }
}

resource presentationFlowBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: 'presentation-flow'
  parent: verifiedOrchestrationPrivateStorageBlobService
  properties: {
    publicAccess: 'None'
  }
}

resource privateStorageDeletePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  name: 'default'
  parent: privateStorageAccount
  dependsOn: [
    verifiedOrchestrationPrivateStorageBlobService
  ]
  properties: {
    policy: {
      rules: [
        {
          name: 'DeleteOidcAccounts'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'oidc/accounts/'
              ]
            }
            actions: {
              baseBlob: {
                delete: {
                  daysAfterLastAccessTimeGreaterThan: 14 // Matches OIDC TTL (e.g. session 14 days)
                }
              }
              version: {
                delete: {
                  daysAfterCreationGreaterThan: 14
                }
              }
            }
          }
        }
        {
          name: 'DeleteAfter-1-days'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'async-issuance/1-day/'
              ]
            }
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: 1
                }
              }
              version: {
                delete: {
                  daysAfterCreationGreaterThan: 1
                }
              }
            }
          }
        }
        {
          name: 'DeleteAfter-3-days'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'async-issuance/3-days/'
              ]
            }
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: 3
                }
              }
              version: {
                delete: {
                  daysAfterCreationGreaterThan: 3
                }
              }
            }
          }
        }
        {
          name: 'DeleteAfter-7-days'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'async-issuance/7-days/'
              ]
            }
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: 7
                }
              }
              version: {
                delete: {
                  daysAfterCreationGreaterThan: 7
                }
              }
            }
          }
        }
        {
          name: 'DeleteAfter-14-days'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'async-issuance/14-days/'
              ]
            }
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: 14
                }
              }
              version: {
                delete: {
                  daysAfterCreationGreaterThan: 14
                }
              }
            }
          }
        }
        {
          name: 'DeleteAfter-30-days'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'async-issuance/30-days/'
              ]
            }
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: 30
                }
              }
              version: {
                delete: {
                  daysAfterCreationGreaterThan: 30
                }
              }
            }
          }
        }
        {
          name: 'DeleteAfter-90-days'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'async-issuance/90-days/'
              ]
            }
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: 90
                }
              }
              version: {
                delete: {
                  daysAfterCreationGreaterThan: 90
                }
              }
            }
          }
        }
      ]
    }
  }
}

resource asyncIssuanceBlobContainerRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: asyncIssuanceBlobContainer
  name: guid(asyncIssuanceBlobContainer.id, apiAppService.id, storageBlobContributorRoleDefinition.id)
  properties: {
    roleDefinitionId: storageBlobContributorRoleDefinition.id
    principalId: apiAppService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource oidcBlobContainerRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: oidcBlobContainer
  name: guid(oidcBlobContainer.id, apiAppService.id, storageBlobContributorRoleDefinition.id)
  properties: {
    roleDefinitionId: storageBlobContributorRoleDefinition.id
    principalId: apiAppService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource presentationFlowBlobContainerRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: presentationFlowBlobContainer
  name: guid(presentationFlowBlobContainer.id, apiAppService.id, storageBlobContributorRoleDefinition.id)
  properties: {
    roleDefinitionId: storageBlobContributorRoleDefinition.id
    principalId: apiAppService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

@description('The ID of the app service plan to host instance app services')
param appServicePlanId string

@description('App Service Plan zone redundancy')
param appServiceZoneRedundant bool = false

@description('Common properties for the API app service')
var apiAppServiceProperties = {
  serverFarmId: appServicePlanId
  httpsOnly: true
  clientAffinityEnabled: false
  virtualNetworkSubnetId: appServiceSubnetId
  siteConfig: {
    alwaysOn: true
    healthCheckPath: '/health'
    appCommandLine: 'pm2 start ./src/main.tracing.js --no-daemon'
    ftpsState: 'Disabled'
    linuxFxVersion: 'NODE|22-lts'
    minTlsVersion: '1.2'
    vnetRouteAllEnabled: true
    minimumElasticInstanceCount: appServiceZoneRedundant ? 2 : 1
  }
}

resource apiAppService 'Microsoft.Web/sites@2022-03-01' = {
  name: '${resourcePrefix}-api-${uniqueSuffix}'
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: apiAppServiceProperties
}

resource apiAppServiceSlot 'Microsoft.Web/sites/slots@2022-03-01' = {
  name: 'staging'
  parent: apiAppService
  location: location
  kind: 'app,linux'
  properties: apiAppServiceProperties
}

resource apiAppDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (nodeEnv == 'nonprod') {
  name: 'WebAppServiceLogs'
  scope: apiAppService
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
      {
        category: 'AppServicePlatformLogs'
        enabled: true
      }
    ]
    metrics: []
  }
}

output apiAppServicePrincipalId string = apiAppService.identity.principalId
output apiAppServiceName string = apiAppService.name
output apiAppServiceDefaultHostname string = apiAppService.properties.defaultHostName
output apiAppServiceCustomDomainVerificationId string = apiAppService.properties.customDomainVerificationId

resource monitoringMetricsPublisherRoleDefinition 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  scope: subscription()
  name: '3913510d-42f4-4e42-8a64-420c390055eb'
}

resource webAppToDcrRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(auditTracesDataCollectionRule.id, apiAppService.id, monitoringMetricsPublisherRoleDefinition.id)
  scope: auditTracesDataCollectionRule
  properties: {
    roleDefinitionId: monitoringMetricsPublisherRoleDefinition.id
    principalId: apiAppService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

param sqlServerName string
param nodeEnv string
param apiClientId string

resource apiAppServiceSlotConfig 'Microsoft.Web/sites/slots/config@2022-03-01' = {
  name: 'appsettings'
  parent: apiAppServiceSlot
  properties: {
    NODE_ENV: nodeEnv
    WEBSITE_RUN_FROM_PACKAGE: '1'
    APPINSIGHTS_INSTRUMENTATION_KEY: apiAppInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: apiAppInsights.properties.ConnectionString
    INSTANCE: instance
    VERSION: releaseVersion
    CORS_ORIGIN: corsOrigin
    COOKIE_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(apiCookieSecret) ? apiCookieSecretSecretExisting : apiCookieSecretSecret).properties.secretUri})'
    SMS_SECRET: '@Microsoft.KeyVault(SecretUri=${smsSecretSecret.properties.secretUri})'
    SMS_PRIMARY_TOKEN: '@Microsoft.KeyVault(SecretUri=${smsPrimaryTokenSecret.properties.secretUri})'
    EMAIL_API_KEY: '@Microsoft.KeyVault(SecretUri=${emailApiKeySecret.properties.secretUri})'
    EMAIL_WEBHOOK_FORWARDER_SECRET: '@Microsoft.KeyVault(SecretUri=${emailWebhookForwarderSecretSecret.properties.secretUri})'
    DATABASE_HOST: '${sqlServerName}${az.environment().suffixes.sqlServerHostname}'
    DATABASE_NAME: '${resourcePrefix}-sql-db'
    REDIS_KEY: '@Microsoft.KeyVault(SecretUri=${managedRedisKeySecret.properties.secretUri})'
    REDIS_HOST: managedRedis.properties.hostName
    REDIS_PORT: string(managedRedisDatabase.properties.port)
    BLOB_STORAGE_URL: 'https://${verifiedOrchestrationStorage.name}.blob.${az.environment().suffixes.storage}'
    PRIVATE_BLOB_STORAGE_URL: 'https://${privateStorageAccount.name}.blob.${az.environment().suffixes.storage}'
    PRIVATE_STORAGE_ENCRYPTION_KEY: '@Microsoft.KeyVault(SecretUri=${(empty(privateStorageClientEncryptionKey) ? privateStorageClientEncryptionKeySecretExisting : privateStorageClientEncryptionKeySecret).properties.secretUri})'
    OIDC_KEY_VAULT_URL: oidcKeyVault.properties.vaultUri
    IDENTITY_STORE_KEY_VAULT_URL: identityStoreKeyVault.properties.vaultUri
    API_CLIENT_ID: apiClientId
    API_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(apiClientSecret) ? apiClientSecretSecretExisting : apiClientSecretSecret).properties.secretUri})'
    API_CLIENT_URI: apiClientId
    INTERNAL_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${internalClientSecretSecret.properties.secretUri})'
    VID_CALLBACK_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${vidCallbackClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAccessClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedAccessSecret) ? limitedAccessSecretSecretExisting : limitedAccessSecretSecret).properties.secretUri})'
    LIMITED_PRESENTATION_FLOW_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedPresentationFlowClientSecretSecret.properties.secretUri})'
    LIMITED_PRESENTATION_FLOW_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedPresentationFlowSecret) ? limitedPresentationFlowSecretSecretExisting : limitedPresentationFlowSecretSecret).properties.secretUri})'
    LIMITED_PHOTO_CAPTURE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedPhotoCaptureClientSecretSecret.properties.secretUri})'
    LIMITED_PHOTO_CAPTURE_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedPhotoCaptureSecret) ? limitedPhotoCaptureSecretSecretExisting : limitedPhotoCaptureSecretSecret).properties.secretUri})'
    LIMITED_ASYNC_ISSUANCE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAsyncIssuanceClientSecretSecret.properties.secretUri})'
    LIMITED_ASYNC_ISSUANCE_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedAsyncIssuanceSecret) ? limitedAsyncIssuanceSecretSecretExisting : limitedAsyncIssuanceSecretSecret).properties.secretUri})'
    LIMITED_DEMO_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedDemoClientSecretSecret.properties.secretUri})'
    LIMITED_OIDC_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedOidcClientSecretSecret.properties.secretUri})'
    LIMITED_OIDC_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedOidcSecret) ? limitedOidcSecretSecretExisting : limitedOidcSecretSecret).properties.secretUri})'
    HOME_TENANT_NAME: homeTenantName
    HOME_TENANT_ID: homeTenantId
    HOME_TENANT_VID_SERVICE_CLIENT_ID: homeTenantVidServiceClientId
    HOME_TENANT_VID_SERVICE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${homeTenantVidServiceClientSecretSecret.properties.secretUri})'
    VID_AUTHORITY_ID: '@Microsoft.KeyVault(SecretUri=${vidAuthorityIdSecret.properties.secretUri})'
    DEV_TOOLS_ENABLED: devToolsEnabled
    FACE_CHECK_ENABLED: faceCheckEnabled
    DEMO_ENABLED: demoEnabled
    MDOC_PRESENTATIONS_ENABLED: mdocPresentationsEnabled
    MDOC_MULTIPAZ_TEST_CERTIFICATES_ENABLED: mdocMultipazTestCertificatesEnabled
    IDENTITY_ISSUERS: identityIssuers
    PLATFORM_CONSUMER_APPS: platformConsumerApps
    ADDITIONAL_AUTH_TENANT_IDS: additionalAuthTenantIds
    GRAPHQL_MAX_ALIASES: graphqlMaxAliases
    GRAPHQL_MAX_DEPTH: graphqlMaxDepth
    GRAPHQL_MAX_DIRECTIVES: graphqlMaxDirectives
    GRAPHQL_MAX_TOKENS: graphqlMaxTokens
    LOG_LEVEL: logLevel
    WEBSITE_WARMUP_PATH: '/azure-startup-probe-40nt0001ihrkbxdry635'
    WEBSITE_SWAP_WARMUP_PING_PATH: '/azure-startup-probe-40nt0001ihrkbxdry635'
    WEBSITE_WARMUP_STATUSES: '200'
    WEBSITE_SWAP_WARMUP_PING_STATUSES: '200'
    // The default is 230 (3:50), increase to 600 (10:00)
    WEBSITES_CONTAINER_START_TIME_LIMIT: '600'
    AUDIT_DATA_COLLECTION_ENDPOINT: auditTracesDataCollectionEndpoint.properties.logsIngestion.endpoint
    AUDIT_DATA_COLLECTION_RULE_ID: auditTracesDataCollectionRule.properties.immutableId
  }
}

param sharedResourceGroupName string

var rawWorkBookData = string(loadJsonContent('./workbook.json'))
var serialisedWorkBookData = replace(
  replace(
    replace(
      replace(rawWorkBookData, '<appInsightsResourceId>', apiAppInsights.id),
      '<appInsightsResourceName>',
      apiAppInsights.name
    ),
    '<managedRedisResourceId>',
    managedRedis.id
  ),
  '<managedRedisResourceName>',
  managedRedis.name
)

resource workbook 'Microsoft.Insights/workbooks@2023-06-01' = {
  location: location
  name: guid(resourceGroup().id, '${resourcePrefix}-api-workbook')
  kind: 'shared'
  properties: {
    displayName: '${resourcePrefix}-api-workbook'
    category: 'workbook'
    serializedData: serialisedWorkBookData
    sourceId: apiAppInsights.id
  }
}

@description('Shared locations for availability tests')
var availabilityTestLocations = [
  { Id: 'emea-au-syd-edge' } // Australia East
  { Id: 'us-ca-sjc-azr' } // West US
]

@description('Shared Interval in seconds between test runs for availability test')
var availabilityTestFrequency = 300

@description('Shared evaluation frequency how often the metric alert is evaluated')
var alertEvaluationFrequency = 'PT5M'

@description('Shared window size the period of time that is used to monitor alert activity based on the threshold')
var alertWindowSize = 'PT5M'

@description('Common validation rules for web tests')
var commonValidationRules = {
  ExpectedHttpStatusCode: 200
  SSLCertRemainingLifetimeCheck: 7
  SSLCheck: true
}

resource apiAvailabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: '${resourcePrefix}-api-availability-test'
  location: location
  kind: 'standard'
  tags: {
    'hidden-link:${apiAppInsights.id}': 'Resource'
  }
  properties: {
    Description: 'Availbility test for the API using the well known oidc endpoint'
    Enabled: true
    Frequency: availabilityTestFrequency
    Kind: 'standard'
    Locations: availabilityTestLocations
    Name: '${resourcePrefix}-api-availability-webtest'
    Request: {
      HttpVerb: 'GET'
      ParseDependentRequests: false
      RequestUrl: 'https://${instance}.api.${domain}/oidc/.well-known/openid-configuration'
    }
    RetryEnabled: true
    SyntheticMonitorId: '${resourcePrefix}-api-availability-webtest'
    Timeout: 30
    ValidationRules: {
      ...commonValidationRules
      ContentValidation: {
        ContentMatch: '"issuer"' // Validate JSON by checking the presence of the key "issuer"
        IgnoreCase: true
        PassIfTextFound: true
      }
    }
  }
}

resource apiAvailabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (!empty(actionGroupAlertName)) {
  name: '${resourcePrefix}-api-availability-alert'
  location: 'global'
  tags: {
    'hidden-link:${apiAppInsights.id}': 'Resource'
    'hidden-link:${apiAvailabilityTest.id}': 'Resource'
  }
  properties: {
    description: 'Triggers when API healthchecks fails'
    severity: 0
    enabled: true
    scopes: [
      apiAppInsights.id
      apiAvailabilityTest.id
    ]
    evaluationFrequency: alertEvaluationFrequency
    windowSize: alertWindowSize
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: apiAvailabilityTest.id
      componentId: apiAppInsights.id
      failedLocationCount: 2
    }
    actions: [
      {
        actionGroupId: actionGroupAlertId
      }
    ]
  }
}

resource msGraphServiceHealthAlert 'microsoft.insights/metricAlerts@2018-03-01' = if (!empty(actionGroupAlertName)) {
  name: '${resourcePrefix}-msgraphservice-health-alert-v2'
  location: 'global'
  properties: {
    description: 'Triggers when MS Graph service health check fails'
    severity: 1
    enabled: true
    scopes: [
      apiAppInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          threshold: json('1')
          name: 'Metric1'
          metricNamespace: 'Azure.ApplicationInsights'
          metricName: 'ms-graph-service'
          operator: 'GreaterThanOrEqual'
          timeAggregation: 'Maximum'
          skipMetricValidation: true
          criterionType: 'StaticThresholdCriterion'
        }
      ]
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
    }
    autoMitigate: true
    targetResourceType: 'Microsoft.Insights/components'
    targetResourceRegion: 'australiaeast'
    actions: [
      {
        actionGroupId: actionGroupAlertId
      }
    ]
  }
}

resource vidServiceHealthAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (!empty(actionGroupAlertName)) {
  name: '${resourcePrefix}-vidservice-health-alert-v2'
  location: 'global'
  properties: {
    description: 'Triggers when Verified ID service health check fails'
    severity: 1
    enabled: true
    scopes: [
      apiAppInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          threshold: json('1')
          name: 'Metric1'
          metricNamespace: 'Azure.ApplicationInsights'
          metricName: 'verified-id-service'
          operator: 'GreaterThanOrEqual'
          timeAggregation: 'Maximum'
          skipMetricValidation: true
          criterionType: 'StaticThresholdCriterion'
        }
      ]
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
    }
    autoMitigate: true
    targetResourceType: 'Microsoft.Insights/components'
    targetResourceRegion: 'australiaeast'
    actions: [
      {
        actionGroupId: actionGroupAlertId
      }
    ]
  }
}
