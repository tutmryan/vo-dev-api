@description('The list of IP addresses to allow to access the Azure SQL server')
param ipAddresses array

@description('The name of the SQL server')
param sqlServerName string

@description('The rule prefix to use before the IP address')
param rulePrefix string = 'Allow'

var entries = [for i in range(0, length(ipAddresses)): {
  name: '${rulePrefix}_${replace(ipAddresses[i], '.', '_')}'
  startIP: '${ipAddresses[i]}'
  endIP: '${ipAddresses[i]}'
}]

resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' existing = {
  name: sqlServerName
}

resource sqlServerFirewallEntries 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = [for entry in entries: {
  name: entry.name
  parent: sqlServer
  properties: {
    startIpAddress: entry.startIP
    endIpAddress: entry.endIP
  }
}]
