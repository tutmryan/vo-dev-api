[CmdletBinding()]
param(
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
  $KeyVaultName,

  [Parameter(Mandatory = $true)]
  [string]
  $OrganisationName,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://')]
  [string]
  $LinkedDomainUrl
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  didResourceId            = '6a8b4b39-c021-437c-b060-5a14a3fd65f3'

  didContainerName         = '$web'
  didBlobName              = '.well-known/did.json'
  didConfigurationBlobName = '.well-known/did-configuration.json'
  contentTypeJson          = 'application/json'
}

#
# Check if the Verified ID service is already enabled
#
$authorityId = $null
$linkedDomainsVerified = $false

$authorities = az rest `
  --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
  --resource $constants.didResourceId `
  --query 'value' | ConvertFrom-Json

$authority = $authorities | Where-Object -FilterScript { $_.didModel.linkedDomainUrls -eq $LinkedDomainUrl }[0]

if ($null -ne $authority) {
  $authorityId = $authority.id
  $linkedDomainsVerified = $authority.linkedDomainsVerified

  Write-Output ('Verified ID Authority is already created')
  Write-Output ('Authority ID: {0}' -f $authorityId)

} else {

  # a user access token is requried to call the following endpoints
  # the user would need to have
  #   - at least the authentication policy administrator Entra role assigned,
  #   - enough permissions to upload DID files to the storage account, and
  #   - Get, List, Create, Delete, Sign key permissions in the keyvault used by the Verified ID service
  # the issue is documented [here](https://drive.google.com/file/d/1FDK2dLGKu8Uc_J3FxvIOYTXGmrMmQpUF/view?usp=drive_link)
  #
  # - create authority; POST /v1.0/verifiableCredentials/authorities
  # - generate DID document; POST /v1.0/verifiableCredentials/authorities/:authorityId/generateDidDocument
  # - generate well known DID configuration; POST /v1.0/verifiableCredentials/authorities/:authorityId/generateWellknownDidConfiguration
  # - validate well known DID configuratino; POST /v1.0/verifiableCredentials/authorities/:authorityId/validateWellKnownDidConfiguration
  az login --tenant $TenantId --use-device-code

  #
  # Enable Verified ID service
  #
  $keyVaultResourceUrl = az keyvault list `
    --resource-group $KeyVaultResourceGroupName `
    --query ("[?name=='{0}'].properties.vaultUri" -f $KeyVaultName) `
    --output tsv

  $enableVerifiedIdServicePayload = @{
    didMethod        = 'web'
    keyVaultMetadata = @{
      resourceGroup  = $KeyVaultResourceGroupName
      resourceName   = $KeyVaultName
      resourceUrl    = $keyVaultResourceUrl
      subscriptionId = $SubscriptionId
    }
    linkedDomainUrl  = $LinkedDomainUrl
    name             = $OrganisationName
  }

  $enableVerifiedIdServicePayloadJson = ($enableVerifiedIdServicePayload | ConvertTo-Json -Depth 10 -Compress)

  Write-Output 'Creating Verified ID Authority...'

  $authority = az rest `
    --method post `
    --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
    --resource $constants.didResourceId `
    --body $enableVerifiedIdServicePayloadJson ` | ConvertFrom-Json

  $authorityId = $authority.id

  Write-Output 'Created Verified ID Authority...'
  Write-Output ('Authority ID: {0}' -f $authorityId)

  # log out the user session to prevent the CI/CD actions following this script from being executed in the user's context
  az logout
}

Write-Output "authorityId=$($authorityId)" >> $Env:GITHUB_OUTPUT
Write-Output "linkedDomainsVerified=$($linkedDomainsVerified)" >> $Env:GITHUB_OUTPUT

return @{
  authorityId           = $authorityId
  linkedDomainsVerified = $linkedDomainsVerified
}

