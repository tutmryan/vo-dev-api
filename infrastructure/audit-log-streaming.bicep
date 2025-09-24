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

resource auditTracesEventHubConsumerGroups 'Microsoft.EventHub/namespaces/eventhubs/consumergroups@2022-10-01-preview' = {
  name: '${resourcePrefix}-extract-audit-traces'
  parent: auditTracesEventHub
}

resource auditTracesDataExport 'Microsoft.OperationalInsights/workspaces/dataExports@2020-08-01' = {
  name: '${resourcePrefix}-ehr-export-audit-traces'
  parent: logAnalytics
  properties: {
    destination: {
      resourceId: eventHubNamespace.id
      metaData: {
        eventHubName: auditTracesEventHub.name
      }
    }
    enable: true
    tableNames: [
      'AuditTraces_CL'
    ]
  }
}
