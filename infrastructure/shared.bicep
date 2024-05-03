@description('The resource prefix to use for all resources')
@minLength(3)
param resourcePrefix string

param location string = resourceGroup().location

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${resourcePrefix}-la'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 180
    features: {
      enableDataExport: true
    }
  }
}

resource sqlServerUserAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${resourcePrefix}-sql-server-identity'
  location: location
}

@description('Name of the Azure SQL AAD administrator')
param sqlServerAadAdministratorName string

@description('Object ID of the Azure SQL AAD administrator')
param sqlServerAadAdministratorObjectId string

resource sqlServer1 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: '${resourcePrefix}-sql-server-1'
  location: location
  identity: {
    userAssignedIdentities: {
      '${sqlServerUserAssignedIdentity.id}': {}
    }
    type: 'UserAssigned'
  }
  properties: {
    primaryUserAssignedIdentityId: sqlServerUserAssignedIdentity.id
    administrators: {
      azureADOnlyAuthentication: true
      administratorType: 'ActiveDirectory'
      login: sqlServerAadAdministratorName
      sid: sqlServerAadAdministratorObjectId
      tenantId: subscription().tenantId
    }
  }
}

resource sqlServer1AuditingSettings 'Microsoft.Sql/servers/auditingSettings@2023-05-01-preview' = {
  name: 'default'
  parent: sqlServer1
  properties: {
    auditActionsAndGroups: [
      'BATCH_COMPLETED_GROUP'
      'SUCCESSFUL_DATABASE_AUTHENTICATION_GROUP'
      'FAILED_DATABASE_AUTHENTICATION_GROUP'
    ]
    isAzureMonitorTargetEnabled: true
    isDevopsAuditEnabled: true
    state: 'Enabled'
  }
}

resource sqlServer1Master 'Microsoft.Sql/servers/databases@2020-08-01-preview' existing = {
  name: 'master'
  parent: sqlServer1
}

resource sqlServer1MasterDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: sqlServer1Master
  name: 'diagnostics'
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'SQLSecurityAuditEvents'
        enabled: true
      }
      {
        category: 'DevOpsOperationsAudit'
        enabled: true
      }
    ]
  }
}

@description('Elastic Pool edition')
@allowed(['Basic', 'Standard', 'Premium', 'GP_Gen5', 'BC_Gen5'])
param elasticPoolEdition string = 'Basic'

@description('Elastic Pool Capacity (vCores or DTU, depends on tier, please refer to docs)')
param elasticPoolCapacity int

@description('Elastic Pool zone redundant')
param elasticPoolZoneRedundant bool = false

@description('Elastic Pool - The minimum capacity any one database can consume, .')
param elasticPoolPerDatabaseMinCapacity int = 0

@description('Elastic Pool - The maximum capacity any one database can consume, not set if left as default.')
param elasticPoolPerDatabaseMaxCapacity int = 0

var editionToSkuMap = {
  Basic: {
    name: 'BasicPool'
    tier: 'Basic'
  }
  Standard: {
    name: 'StandardPool'
    tier: 'Standard'
  }
  Premium: {
    name: 'PremiumPool'
    tier: 'Premium'
  }
  GP_Gen5: {
    family: 'Gen5'
    name: 'GP_Gen5'
    tier: 'GeneralPurpose'
  }
  BC_Gen5: {
    family: 'Gen5'
    name: 'BC_Gen5'
    tier: 'BusinessCritical'
  }
}

resource sqlServerElasticPool 'Microsoft.Sql/servers/elasticPools@2022-05-01-preview' = {
  name: '${resourcePrefix}-sql-elastic-pool'
  location: location
  sku: {
    capacity: elasticPoolCapacity
    name: editionToSkuMap[elasticPoolEdition].name
    tier: editionToSkuMap[elasticPoolEdition].tier
  }
  parent: sqlServer1
  properties: {
    zoneRedundant: elasticPoolZoneRedundant
    perDatabaseSettings: union(
      { minCapacity: elasticPoolPerDatabaseMinCapacity },
      elasticPoolPerDatabaseMaxCapacity > 0 ? { maxCapacity: elasticPoolPerDatabaseMaxCapacity } : {}
    )
  }
}

output sqlServer1Name string = sqlServer1.name

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

@description('App Service Plan Capacity (instances)')
param appServicePlanCapacity int = 1

resource appServicePlan1 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${resourcePrefix}-app-service-plan-1'
  location: location
  sku: {
    name: appServicePlanSku
    capacity: appServicePlanCapacity
  }
  properties: {
    reserved: true
  }
  kind: 'linux'
}

output appServicePlan1Id string = appServicePlan1.id
