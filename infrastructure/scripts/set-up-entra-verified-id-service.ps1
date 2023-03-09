[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $TenantId,

  [Parameter(Mandatory = $true)]
  [string]
  $SubscriptionId,

  [Parameter(Mandatory = $true)]
  [string]
  $KeyVaultResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $KeyVaultResourceGroupLocation,

  [Parameter(Mandatory = $true)]
  [string]
  $KeyVaultName,

  [Parameter(Mandatory = $true)]
  [string]
  $OrganizationName,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://')]
  [string]
  $LinkedDomainUrl
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  didResourceId                         = '6a8b4b39-c021-437c-b060-5a14a3fd65f3'
  verifiedCredentialServiceAppId        = 'bb2a64ee-5d29-4b07-a491-25806dc854d3'
  verifiedCredentialServiceRequestAppId = '3db474b9-6a0c-4840-96ac-1fceb342124f'
}

#
# Make sure we're logged in to the right tenant and subscription
#
$contextDetails = az account show --query '{subscriptionId: id, tenantId: tenantId}' | ConvertFrom-Json
if ($contextDetails.tenantId -ne $TenantId) {
  throw ('You are not currently logged id to the tenant with id ''{0}''. Current tenant: ''{1}''.' -f $TenantId, $contextDetails.tenantId)
}

if ($contextDetails.subscriptionId -ne $SubscriptionId) {
  throw ('You are not currently logged id to the subscription with id ''{0}''. Current subscription: ''{1}''.' -f $SubscriptionId, $contextDetails.subscriptionId)
}

#
# Create resource group
#
$resourceGroup = az group list --query ("[?name=='{0}']" -f $KeyVaultResourceGroupName) --output tsv
if ($null -ne $resourceGroup) {
  Write-Output ('Found existing resource group ''{0}''' -f $KeyVaultResourceGroupName)
} else {
  Write-Output ('Creating resource group ''{0}''...' -f $KeyVaultResourceGroupName)

  az group create --location $KeyVaultResourceGroupLocation --name $KeyVaultResourceGroupName --output none

  Write-Output ('Created resource group ''{0}''' -f $KeyVaultResourceGroupName)
}

#
# Create resource group lock
#
$resourceGroupLock = az group lock list `
  --resource-group $KeyVaultResourceGroupName `
  --query "[?level=='CanNotDelete']" `
  --output tsv

if ($null -ne $resourceGroupLock) {
  Write-Output 'Found existing resource group lock'
} else {
  Write-Output 'Creating resource group lock...'

  az group lock create `
    --resource-group $KeyVaultResourceGroupName `
    --name 'CanNotDelete' `
    --lock-type CanNotDelete `
    --output none

  Write-Output 'Created resource group lock'
}

#
# Create Key Vault
#
$keyVault = az keyvault list --resource-group $KeyVaultResourceGroupName --query ("[?name=='{0}']" -f $KeyVaultName) --output tsv
if ($null -ne $keyVault) {
  Write-Output ('Found existing Key Vault ''{0}''' -f $KeyVaultName)
} else {
  Write-Output ('Creating Key Vault ''{0}''...' -f $KeyVaultName)

  az keyvault create `
    --resource-group $KeyVaultResourceGroupName `
    --name $KeyVaultName `
    --no-self-perms true `
    --output none

  Write-Output ('Created Key Vault ''{0}''' -f $KeyVaultName)
}

#
# Check if the Verified ID service is already enabled
#
$authorities = az rest `
  --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
  --resource $constants.didResourceId `
  --query 'value' | ConvertFrom-Json

if (($authorities | Measure-Object).Count -ne 0) {
  Write-Output ('Verified ID service is already enabled')
} else {

  #
  # Add necessary access policy to current user
  #
  $currentPrincipalObjectId = az ad signed-in-user show --query 'id' --output tsv

  Write-Output 'Adding necessary access policy for currently logged-in principal...'

  az keyvault set-policy `
    --name $KeyVaultName `
    --object-id $currentPrincipalObjectId `
    --key-permissions create delete sign `
    --output none

  Write-Output 'Added necessary access policy for currently logged-in principal'


  #
  # Enable Verified ID service
  #
  $keyVaultResourceUrl = az keyvault list `
    --resource-group $KeyVaultResourceGroupName `
    --query ("[?name=='{0}'].properties.vaultUri" -f $KeyVaultName) `
    --output tsv

  $enableVerifiedIdServicePayload = @{
    didMethod        = 'ion'
    keyVaultMetadata = @{
      resourceGroup  = $KeyVaultResourceGroupName
      resourceName   = $KeyVaultName
      resourceUrl    = $keyVaultResourceUrl
      subscriptionId = $SubscriptionId
    }
    linkedDomainUrl  = $LinkedDomainUrl
    name             = $OrganizationName
  }

  $enableVerifiedIdServicePayloadJson = ($enableVerifiedIdServicePayload | ConvertTo-Json -Depth 10 -Compress) -replace '"', '\"'

  Write-Output 'Enabling Verified ID service...'

  az rest `
    --method post `
    --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
    --resource $constants.didResourceId `
    --body $enableVerifiedIdServicePayloadJson `
    --output none

  Write-Output 'Enabled Verified ID service...'

  Write-Output 'Deleting access policy for currently logged-in principal...'

  az keyvault delete-policy `
    --name $KeyVaultName `
    --object-id $currentPrincipalObjectId `
    --output none

  Write-Output 'Deleted access policy for currently logged-in principal'
}

#
# Add necessary access policies for service applications
# This is done automatically when going through the portal, but not when automated
#
# See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/verifiable-credentials-configure-tenant#set-access-policies-for-the-verified-id-service-principals
#
Write-Output 'Adding necessary access policies for Verified ID service principals...'

$verifiableCredentialServiceObjectId = az ad sp list --query ("[?appId=='{0}'].id" -f $constants.verifiedCredentialServiceAppId) --all --output tsv
az keyvault set-policy `
  --name $KeyVaultName `
  --object-id $verifiableCredentialServiceObjectId `
  --key-permissions get sign `
  --output none

$verifiableCredentialServiceRequestObjectId = az ad sp list --query ("[?appId=='{0}'].id" -f $constants.verifiedCredentialServiceRequestAppId) --all --output tsv
az keyvault set-policy `
  --name $KeyVaultName `
  --object-id $verifiableCredentialServiceRequestObjectId `
  --key-permissions sign `
  --output none

Write-Output ('Added necessary access policies for Verified ID service principals')
