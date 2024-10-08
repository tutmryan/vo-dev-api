@description('The resource prefix to use for all resources')
@minLength(3)
param resourcePrefix string

@description('The ID of the deployment service principal')
param deploymentServicePrincipalObjectId string

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
  sku: {
    name: 'standard'
    family: 'A'
  }
  enablePurgeProtection: true
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
  ]
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

resource apiCookieSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (!empty(apiCookieSecret)) {
  name: 'API-COOKIE-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: apiCookieSecret
  }
}

resource apiCookieSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = if (empty(apiCookieSecret)) {
  name: 'API-COOKIE-SECRET'
  parent: keyVault
}

@description('The SMS credential secret')
@secure()
param smsSecret string

resource smsSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'SMS-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: smsSecret
  }
}

@description('The email API key')
@secure()
param emailApiKey string

resource emailApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'EMAIL-API-KEY'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: emailApiKey
  }
}

@description('The client secret of the API app registration in Azure AD')
@secure()
param apiClientSecret string

resource apiClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (!empty(apiClientSecret)) {
  name: 'API-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: apiClientSecret
  }
}

resource apiClientSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = if (empty(apiClientSecret)) {
  name: 'API-CLIENT-SECRET'
  parent: keyVault
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

@description('The secret for limited access data keys')
@secure()
param limitedAccessSecret string

resource limitedAccessSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (!empty(limitedAccessSecret)) {
  name: 'LIMITED-ACCESS-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedAccessSecret
  }
}

resource limitedAccessSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = if (empty(limitedAccessSecret)) {
  name: 'LIMITED-ACCESS-SECRET'
  parent: keyVault
}

@description('The client secret of the limited approval client')
@secure()
param limitedApprovalClientSecret string

resource limitedApprovalClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'LIMITED-APPROVAL-CLIENT-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedApprovalClientSecret
  }
}

@description('The secret for limited approval data keys')
@secure()
param limitedApprovalSecret string

resource limitedApprovalSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (!empty(limitedApprovalSecret)) {
  name: 'LIMITED-APPROVAL-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedApprovalSecret
  }
}

resource limitedApprovalSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = if (empty(limitedApprovalSecret)) {
  name: 'LIMITED-APPROVAL-SECRET'
  parent: keyVault
}

@description('The client secret of the limited photo capture client')
@secure()
param limitedPhotoCaptureClientSecret string

resource limitedPhotoCaptureClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
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

resource limitedPhotoCaptureSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (!empty(limitedPhotoCaptureSecret)) {
  name: 'LIMITED-PHOTO-CAPTURE-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedPhotoCaptureSecret
  }
}

resource limitedPhotoCaptureSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = if (empty(limitedPhotoCaptureSecret)) {
  name: 'LIMITED-PHOTO-CAPTURE-SECRET'
  parent: keyVault
}

@description('The client secret of the limited async issuance client')
@secure()
param limitedAsyncIssuanceClientSecret string

resource limitedAsyncIssuanceClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
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

resource limitedAsyncIssuanceSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (!empty(limitedAsyncIssuanceSecret)) {
  name: 'LIMITED-ASYNC-ISSUANCE-SECRET'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: limitedAsyncIssuanceSecret
  }
}

resource limitedAsyncIssuanceSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = if (empty(limitedAsyncIssuanceSecret)) {
  name: 'LIMITED-ASYNC-ISSUANCE-SECRET'
  parent: keyVault
}

@description('The client secret of the docs site app registration in Azure AD')
@secure()
param docsSiteClientSecret string
resource docsSiteClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (!empty(docsSiteClientSecret)) {
  name: 'DOCS-SITE-CLIENT-SECRET'
  parent: staticSiteKeyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: docsSiteClientSecret
  }
}

resource docsSiteClientSecretSecretExisting 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = if (empty(docsSiteClientSecret)) {
  name: 'DOCS-SITE-CLIENT-SECRET'
  parent: staticSiteKeyVault
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
@description('The flag indicating whether the face check features (i.e. issuing credentials with face check photo, .etc) are available')
param faceCheckEnabled string
@description('The flag indicating whether the demo features (i.e limited presentation token, presentation demo page, .etc) are deployed')
param demoEnabled string
@description('JWT tokens issued by these tenant IDs are accepted by API in addition to the home tenant and platform tenant')
param additionalAuthTenantIds string

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

@description('The shared action group for alerts, if action group for alerts has not been set up yet this param value will be empty')
param actionGroupAlertName string
var actionGroupAlertId = resourceId(sharedResourceGroupName,'Microsoft.Insights/actionGroups', actionGroupAlertName)

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

resource redisMetricAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if(!empty(actionGroupAlertName)){
  name: '${resourcePrefix}-redis-metric-alert'
  location: 'global'
  properties: {
    description: 'Triggers when the redis cache reaches critical levels'
    severity: 0
    enabled: true
    scopes: [
      redisCache.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
       'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: 80
          name: 'Server Load'
          metricNamespace: 'Microsoft.Cache/Redis'
          metricName: 'serverLoad'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          skipMetricValidation: false
          criterionType: 'StaticThresholdCriterion'
        }
        {
          threshold: 80
          name: 'Used Memory Percentage'
          metricNamespace: 'Microsoft.Cache/Redis'
          metricName: 'usedmemorypercentage'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          skipMetricValidation: false
          criterionType: 'StaticThresholdCriterion'
        }
        {
          threshold: 5625
          name: 'Connected Clients'
          metricNamespace: 'Microsoft.Cache/Redis'
          metricName: 'connectedclients'
          operator: 'GreaterThan'
          timeAggregation: 'Maximum'
          skipMetricValidation: false
          criterionType: 'StaticThresholdCriterion'
        }
        {
          threshold: 100000
          name: 'Cache Read'
          metricNamespace: 'Microsoft.Cache/Redis'
          metricName: 'cacheRead'
          operator: 'GreaterThan'
          timeAggregation: 'Maximum'
          skipMetricValidation: false
          criterionType: 'StaticThresholdCriterion'
        }
        {
          threshold: 80
          name: 'CPU Percentage'
          metricNamespace: 'Microsoft.Cache/Redis'
          metricName: 'percentProcessorTime'
          operator: 'GreaterThan'
          timeAggregation: 'Maximum'
          skipMetricValidation: false
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    targetResourceType: 'Microsoft.Cache/Redis'
    targetResourceRegion: location
    actions: [
      {
        actionGroupId: actionGroupAlertId
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

resource verifiedOrchestrationStorageBlobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
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

var privateStorageIdentity = {
  type: 'UserAssigned'
  userAssignedIdentities: {
    '${privateStorageUserAssignedIdentity.id}': {}
  }
}

var privateStorageProps = {
  allowBlobPublicAccess: false
  publicNetworkAccess: 'Enabled'
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
        ? substring(keyVault.properties.vaultUri, 0, length(keyVault.properties.vaultUri) - 1)
        : keyVault.properties.vaultUri
    }
  }
}

resource privateStorageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: 'voprivate${uniqueSuffix}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_GRS'
  }
  identity: privateStorageIdentity
  properties: privateStorageProps
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

// module privateStorageFirewall './storage-account-firewall.bicep' = {
//   name: 'private-storage-firewall'
//   params: {
//     storageAccountName: privateStorageAccount.name
//     storageAccountIdentity: privateStorageIdentity
//     storageAccountProperties: privateStorageProps
//     location: location
//     ipAddresses: split(apiAppService.properties.outboundIpAddresses, ',')
//   }
// }

@description('The key for encrypting private storage data')
@secure()
param privateStorageClientEncryptionKey string

resource privateStorageClientEncryptionKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (!empty(privateStorageClientEncryptionKey)) {
  name: 'PRIVATE-STORAGE-ENCRYPTION-KEY'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: privateStorageClientEncryptionKey
  }
}

resource privateStorageClientEncryptionKeySecretExisting 'Microsoft.KeyVault/vaults/secrets@2022-07-01' existing = if (empty(privateStorageClientEncryptionKey)) {
  name: 'PRIVATE-STORAGE-ENCRYPTION-KEY'
  parent: keyVault
}

resource verifiedOrchestrationPrivateStorageBlobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  name: 'default'
  parent: privateStorageAccount
}

resource asyncIssuanceBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: 'async-issuance'
  parent: verifiedOrchestrationPrivateStorageBlobService
  properties: {
    publicAccess: 'None'
  }
}

resource privateStorageDeletePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  name: 'default'
  parent: privateStorageAccount
  properties: {
    policy: {
      rules: [
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
param apiClientId string

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
    COOKIE_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(apiCookieSecret) ? apiCookieSecretSecretExisting : apiCookieSecretSecret).properties.secretUri})'
    SMS_SECRET: '@Microsoft.KeyVault(SecretUri=${smsSecretSecret.properties.secretUri})'
    EMAIL_API_KEY: '@Microsoft.KeyVault(SecretUri=${emailApiKeySecret.properties.secretUri})'
    DATABASE_HOST: '${sqlServerName}${az.environment().suffixes.sqlServerHostname}'
    DATABASE_NAME: '${resourcePrefix}-sql-db'
    REDIS_KEY: '@Microsoft.KeyVault(SecretUri=${redisKeySecret.properties.secretUri})'
    REDIS_HOST: '${redisCache.name}.redis.cache.windows.net'
    BLOB_STORAGE_URL: 'https://${verifiedOrchestrationStorage.name}.blob.${az.environment().suffixes.storage}'
    PRIVATE_BLOB_STORAGE_URL: 'https://${privateStorageAccount.name}.blob.${az.environment().suffixes.storage}'
    PRIVATE_STORAGE_ENCRYPTION_KEY: '@Microsoft.KeyVault(SecretUri=${(empty(privateStorageClientEncryptionKey) ? privateStorageClientEncryptionKeySecretExisting : privateStorageClientEncryptionKeySecret).properties.secretUri})'
    API_CLIENT_ID: apiClientId
    API_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(apiClientSecret) ? apiClientSecretSecretExisting : apiClientSecretSecret).properties.secretUri})'
    API_CLIENT_URI: apiClientId
    INTERNAL_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${internalClientSecretSecret.properties.secretUri})'
    VID_CALLBACK_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${vidCallbackClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAccessClientSecretSecret.properties.secretUri})'
    LIMITED_ACCESS_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedAccessSecret) ? limitedAccessSecretSecretExisting : limitedAccessSecretSecret).properties.secretUri})'
    LIMITED_APPROVAL_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedApprovalClientSecretSecret.properties.secretUri})'
    LIMITED_APPROVAL_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedApprovalSecret) ? limitedApprovalSecretSecretExisting : limitedApprovalSecretSecret).properties.secretUri})'
    LIMITED_PHOTO_CAPTURE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedPhotoCaptureClientSecretSecret.properties.secretUri})'
    LIMITED_PHOTO_CAPTURE_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedPhotoCaptureSecret) ? limitedPhotoCaptureSecretSecretExisting : limitedPhotoCaptureSecretSecret).properties.secretUri})'
    LIMITED_ASYNC_ISSUANCE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${limitedAsyncIssuanceClientSecretSecret.properties.secretUri})'
    LIMITED_ASYNC_ISSUANCE_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(limitedAsyncIssuanceSecret) ? limitedAsyncIssuanceSecretSecretExisting : limitedAsyncIssuanceSecretSecret).properties.secretUri})'
    HOME_TENANT_NAME: homeTenantName
    HOME_TENANT_ID: homeTenantId
    HOME_TENANT_GRAPH_CLIENT_ID: homeTenantGraphClientId
    HOME_TENANT_GRAPH_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${homeTenantGraphClientSecretSecret.properties.secretUri})'
    HOME_TENANT_VID_SERVICE_CLIENT_ID: homeTenantVidServiceClientId
    HOME_TENANT_VID_SERVICE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${homeTenantVidServiceClientSecretSecret.properties.secretUri})'
    VID_AUTHORITY_ID: '@Microsoft.KeyVault(SecretUri=${vidAuthorityIdSecret.properties.secretUri})'
    DEV_TOOLS_ENABLED: devToolsEnabled
    FACE_CHECK_ENABLED: faceCheckEnabled
    DEMO_ENABLED : devToolsEnabled
    IDENTITY_ISSUERS: identityIssuers
    PLATFORM_CONSUMER_APPS: platformConsumerApps
    ADDITIONAL_AUTH_TENANT_IDS: additionalAuthTenantIds
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
    AZURE_CLIENT_SECRET: '@Microsoft.KeyVault(SecretUri=${(empty(docsSiteClientSecret) ? docsSiteClientSecretSecretExisting : docsSiteClientSecretSecret).properties.secretUri})'
  }
}

var rawWorkBookData = string(loadJsonContent('./workbook.json'))
var serialisedWorkBookData = replace(
  replace(
    replace(
      replace(rawWorkBookData, '<appInsightsResourceId>', apiAppInsights.id),
      '<appInsightsResourceName>',
      apiAppInsights.name
    ),
    '<redisCacheResourceId>',
    redisCache.id
  ),
  '<redisCacheResourceName>',
  redisCache.name
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

resource apiAvailabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: '${resourcePrefix}-api-availability-test'
  location: location
  kind: 'standard'
  tags: {
    'hidden-link:${apiAppInsights.id}': 'Resource'
  }
  properties: {
    Description: 'Availbility test for the API'
    Enabled: true
    Frequency: 300
    Kind: 'standard'
    Locations: [
      { Id: 'emea-au-syd-edge' } // Australia East
      { Id: 'apac-hk-hkn-azr' } // East Asia
      { Id: 'apac-sg-sin-azr' } // Southeast Asia
      { Id: 'emea-nl-ams-azr' } // West Europe
      { Id: 'emea-gb-db3-azr' } // North Europe
      { Id: 'us-va-ash-azr' } // East US
      { Id: 'us-ca-sjc-azr' } // West US
      { Id: 'latam-br-gru-edge' } // Brazil South
    ]
    Name: '${resourcePrefix}-api-availability-webtest'
    Request: {
      HttpVerb: 'GET'
      ParseDependentRequests: false
      RequestUrl: 'https://${apiAppService.properties.defaultHostName}/health'
    }
    RetryEnabled: true
    SyntheticMonitorId: '${resourcePrefix}-api-availability-webtest'
    Timeout: 30
    ValidationRules: {
      ExpectedHttpStatusCode: 200
      SSLCertRemainingLifetimeCheck: 7
      SSLCheck: true
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
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: apiAvailabilityTest.id
      componentId: apiAppInsights.id
      failedLocationCount: 6
    }
    actions: [
      {
        actionGroupId:  actionGroupAlertId
      }
    ]
  }
}

