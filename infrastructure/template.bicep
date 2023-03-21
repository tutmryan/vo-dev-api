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
  }
}

resource migrationsStorage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: '${resourcePrefix}${environment}vrfdorchstnst'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    allowBlobPublicAccess: false
    publicNetworkAccess: 'Enabled'
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      defaultAction: 'Allow'
    }
    supportsHttpsTrafficOnly: true
  }
}

resource migrationsStorageSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: 'MIGRATIONS-STORAGE-CONNECTION-STRING'
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: 'DefaultEndpointsProtocol=https;AccountName=${migrationsStorage.name};AccountKey=${migrationsStorage.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
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
