targetScope = 'subscription'

param resourceGroupName string
param resourceGroupLocation string

resource newRG 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: resourceGroupName
  location: resourceGroupLocation
}

output resourceGroupUniqueString string = toLower(uniqueString(newRG.id))
