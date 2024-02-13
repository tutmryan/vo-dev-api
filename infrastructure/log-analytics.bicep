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

output logAnalyticsId string = logAnalytics.id
