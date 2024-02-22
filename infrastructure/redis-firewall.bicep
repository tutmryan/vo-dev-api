@description('The list of IP addresses to allow to access the Redis cache')
param ipAddresses array

@description('The name of the Redis cache')
param redisCacheName string

resource redisCache 'Microsoft.Cache/redis@2023-08-01' existing = {
  name: redisCacheName
}

var entries = [for i in range(0, length(ipAddresses)): {
  name: 'Allow_${replace(ipAddresses[i], '.', '_')}'
  startIP: '${ipAddresses[i]}'
  endIP: '${ipAddresses[i]}'
}]

resource redisCacheFirewallEntries 'Microsoft.Cache/redis/firewallRules@2023-08-01' = [for entry in entries: {
  name: entry.name
  parent: redisCache
  properties: {
    startIP: entry.startIP
    endIP: entry.endIP
  }
}]
