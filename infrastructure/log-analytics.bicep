@description('The resource prefix to use for all resources')
@minLength(3)
param resourcePrefix string

param location string = resourceGroup().location

@description('The number of days to retain data in the Log Analytics workspace')
@minValue(30)
@maxValue(365)
param retentionInDays int = 180

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${resourcePrefix}-la'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    features: {
      enableDataExport: true
    }
  }
}

output logAnalyticsId string = logAnalytics.id

resource dataCollectionEndpoint 'Microsoft.Insights/dataCollectionEndpoints@2023-03-11' = {
  // DCE: Provides the HTTPS ingestion endpoint that clients post audit log data to.
  // The DCR (below) references this via dataCollectionEndpointId to authorize + shape data.
  name: '${resourcePrefix}-dce-audit-traces'
  location: location
  properties: {
    description: 'Data Collection Endpoint for audit traces ingestion'
    networkAcls: {
      publicNetworkAccess: 'Enabled'
    }
  }
}

// Custom table that physically stores the ingested records in the workspace.
// Name MUST end with _CL and the stream name in the DCR will be: Custom-<TableName>
resource auditTracesTable 'Microsoft.OperationalInsights/workspaces/tables@2022-10-01' = {
  // Must be the actual table name (must end with _CL) not a prefixed variant
  name: 'AuditTraces_CL'
  parent: logAnalytics
  properties: {
    schema: {
      name: 'AuditTraces_CL'
      displayName: 'Custom Audit Traces'
      description: 'Custom table for application audit traces'
      columns: [
        {
          name: 'TimeGenerated'
          type: 'datetime'
          description: 'Time when the log was ingested by Azure'
        }
        {
          name: 'EventTime'
          type: 'datetime'
          description: 'Time when the event actually occurred (application-generated)'
        }
        {
          name: 'EventTypeId'
          type: 'string'
          description: 'Stable event code (e.g., VO0010) - never changes once assigned'
        }
        {
          name: 'EventType'
          type: 'string'
          description: 'Semantic event type identifier (e.g., api.graphql.operation)'
        }
        {
          name: 'Message'
          type: 'string'
          description: 'Log message'
        }
        {
          name: 'Properties'
          type: 'dynamic'
          description: 'Additional log properties'
        }
      ]
    }
    retentionInDays: retentionInDays
    plan: 'Analytics'
  }
}

// DCR: Binds the DCE to the Log Analytics workspace and maps a declared stream to the destination table.
// Flow: Client -> DCE ingestion endpoint -> DCR stream ("Custom-AuditTraces_CL") -> AuditTraces_CL table.
resource dataCollectionRule 'Microsoft.Insights/dataCollectionRules@2023-03-11' = {
  name: '${resourcePrefix}-dcr-audit-traces'
  location: location
  dependsOn: [
    auditTracesTable
  ]
  properties: {
    description: 'Data Collection Rule for audit traces ingestion'
    dataCollectionEndpointId: dataCollectionEndpoint.id
    streamDeclarations: {
      'Custom-AuditTraces_CL': {
        columns: [
          {
            name: 'TimeGenerated'
            type: 'datetime'
          }
          {
            name: 'EventTime'
            type: 'datetime'
          }
          {
            name: 'EventTypeId'
            type: 'string'
          }
          {
            name: 'EventType'
            type: 'string'
          }
          {
            name: 'Message'
            type: 'string'
          }
          {
            name: 'Properties'
            type: 'dynamic'
          }
        ]
      }
    }
    destinations: {
      logAnalytics: [
        {
          // Name must match what dataFlows references
          name: 'audit-traces-destination'
          workspaceResourceId: logAnalytics.id
        }
      ]
    }
    dataFlows: [
      {
        streams: [
          'Custom-AuditTraces_CL'
        ]
        destinations: [
          'audit-traces-destination'
        ]
        // Removed transformKql for pass-through (optional). Add if you need column shaping.
      }
    ]
  }
}
