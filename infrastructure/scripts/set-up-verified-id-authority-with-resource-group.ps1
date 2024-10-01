[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $SubscriptionId,

  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $AuthorityId,

  [Parameter(Mandatory = $true)]
  [string]
  $Location = 'westus2'
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  apiVersion = '2024-01-26-preview'
}

Write-Output "Setup Verified ID Authority with the resource group..."

$setupAuthorityPayload = @{
  location = $Location
}

$setupAuthorityPayloadJson = ($setupAuthorityPayload | ConvertTo-Json -Compress)

$authoritySetupUri = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.VerifiedId/authorities/$AuthorityId?api-version=$($constants.apiVersion)"

$response = az rest `
  --method PUT `
  --uri $authoritySetupUri `
  --body $setupAuthorityPayloadJson `
  --verbose | ConvertFrom-Json

if ($null -ne $response) {
  Write-Output "Successfully set up Verified ID Authority with the resource group."
  Write-Output "Authority ID: $($AuthorityId)"
} else {
  Write-Error "Failed to set up the Verified ID Authority with resource group."
}

Write-Output "authorityId=$($AuthorityId)" >> $Env:GITHUB_OUTPUT
Write-Output "provisioningState=$($response.properties.provisioningState)" >> $Env:GITHUB_OUTPUT

return @{
  authorityId       = $AuthorityId
  provisioningState = $response.properties.provisioningState
}
