@description('The resource prefix to use for all resources')
@minLength(3)
param resourcePrefix string

@description('The ID of the log analytics workspace to send diagnostics data to')
param logAnalyticsId string

@description('The name of the SQL Server to create the database on')
param sqlServerName string

resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' existing = {
  name: sqlServerName
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' existing = {
  name: '${resourcePrefix}-sql-db'
  parent: sqlServer
}

// https://docs.microsoft.com/en-us/azure/templates/microsoft.insights/2021-05-01-preview/diagnosticsettings?pivots=deployment-language-bicep
resource sqlDatabaseDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diagnostics'
  scope: sqlDatabase
  properties: {
    workspaceId: logAnalyticsId
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
