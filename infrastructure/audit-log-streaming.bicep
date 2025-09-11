@description('The resource prefix to use for all resources')
@minLength(3)
param resourcePrefix string

param location string = resourceGroup().location

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  name: '${resourcePrefix}-la'
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
              consumerGroupName: '${resourcePrefix}-extract-audit-traces'
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
        streamingUnits: 3
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
