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

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourcePrefix}-${environment}-${appName}-ai'
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
        objectId: appService.identity.principalId
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
param appServiceCookieSecret string

var appServiceCookieSecretSecretName = 'APP-COOKIE-SECRET'

resource appServiceCookieSecretSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  name: appServiceCookieSecretSecretName
  parent: keyVault
  properties: {
    attributes: {
      enabled: true
    }
    value: appServiceCookieSecret
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

resource appService 'Microsoft.Web/sites@2022-03-01' = {
  name: '${resourcePrefix}-${environment}-${appName}-api'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      alwaysOn: true
      appCommandLine: 'pm2 start ./src/main.js --no-daemon'
      ftpsState: 'Disabled'
      linuxFxVersion: 'NODE|18-lts'
      minTlsVersion: '1.2'
    }
  }
}

resource appServiceConfig 'Microsoft.Web/sites/config@2022-03-01' = {
  name: 'appsettings'
  parent: appService
  properties: {
    APPINSIGHTS_INSTRUMENTATION_KEY: appInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    COOKIE_SECRET: '@Microsoft.KeyVault(SecretUri=${appServiceCookieSecretSecret.properties.secretUri})'
    DATABASE_HOST: '${sqlInstance.name}${az.environment().suffixes.sqlServerHostname}'
    NODE_ENV: environment
    WEBSITE_RUN_FROM_PACKAGE: '1'
  }
}
