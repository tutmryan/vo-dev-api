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
