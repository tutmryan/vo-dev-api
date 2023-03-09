[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

  [Parameter(Mandatory = $true)]
  [string]
  $IdentifierUri,

  [Parameter(Mandatory = $true)]
  [string]
  $ApiAppRegistrationName,

  [Parameter()]
  [switch]
  $SkipAdminConsent
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  apiAdminScopeValue = 'VerifiableCredentials.Admin'
  graphUserReadScope = @{
    resourceAppId  = '00000003-0000-0000-c000-000000000000'
    resourceAccess = @(@{
        id   = 'e1fe6dd8-ba31-4d61-89e7-88639da4683d'
        type = 'Scope'
      }
    )
  }
}

$apiAppRegistrationAppId = az ad app list --query ("[?displayName=='{0}'].appId" -f $ApiAppRegistrationName) --output tsv
if ($null -eq $apiAppRegistrationAppId) {
  throw ('Unable to find the API app registration named ''{0}''' -f $ApiAppRegistrationName)
}

#
# Create UI app registration if it doesn't exist
#
$appRegistration = az ad app list --display-name $Name --output tsv
if ($appRegistration) {
  Write-Output ('UI app registration ''{0}'' already exists' -f $Name)
} else {
  Write-Output ('Creating UI app registration ''{0}''...' -f $Name)

  az ad app create `
    --display-name $Name `
    --sign-in-audience AzureADMyOrg `
    --output none

  Write-Output ('Created UI app registration ''{0}''' -f $Name)
}

$appRegistrationId = az ad app list --query ("[?displayName=='{0}'].id" -f $Name) --output tsv

#
# Set properties
#
Write-Output 'Setting identifier URI and API permissions'

$apiAdminScopeId = az ad app list `
  --query ("[?appId=='{0}'][].api.oauth2PermissionScopes[?value=='{1}'][].id" -f $apiAppRegistrationAppId, $constants.apiAdminScopeValue) `
  --output tsv

$requiredResourceAccesses = @(
  $constants.graphUserReadScope
  @{
    resourceAppId  = $apiAppRegistrationAppId
    resourceAccess = @(@{
        id   = $apiAdminScopeId
        type = 'Scope'
      }
    )
  }
)

$requiredResourceAccessesJson = (ConvertTo-Json -InputObject $requiredResourceAccesses -Depth 10 -Compress) -replace '"', '\"'

az ad app update `
  --id $appRegistrationId `
  --identifier-uris $IdentifierUri `
  --required-resource-accesses $requiredResourceAccessesJson `
  --output none

Write-Output 'Set identifier URI and API permissions'

if (-not $SkipAdminConsent) {
  Write-Output 'Granting admin consent...'

  az ad app permission admin-consent `
    --id $appRegistrationId `
    --output none

  Write-Output 'Granted admin consent'
}
