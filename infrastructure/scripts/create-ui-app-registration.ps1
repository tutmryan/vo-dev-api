[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

  [Parameter(Mandatory = $true)]
  [string]
  $RedirectUrl,

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
  # This needs to match the value of the scope in api-scopes.json and api config
  apiAdminScopeValue = 'Admin'
}

$apiAppRegistrationClientId = az ad app list --query ("[?displayName=='{0}'].appId" -f $ApiAppRegistrationName) --output tsv
if ($null -eq $apiAppRegistrationClientId) {
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

$appRegistrationClientId = az ad app list --query ("[?displayName=='{0}'].id" -f $Name) --output tsv

#
# Service principal
#
$servicePrincipal = az ad sp list --display-name $Name --output tsv
if ($null -ne $servicePrincipal) {
  Write-Output ('Found an existing service principal named ''{0}''' -f $Name)
} else {
  Write-Output ('Creating a new service principal named ''{0}''...' -f $Name)

  az ad sp create --id $appRegistrationClientId --output none

  Write-Output ('Created a new service principal named ''{0}''' -f $Name)
}

#
# Set properties
#
Write-Output 'Setting API permissions and redirect URLs'

$apiAdminScopeId = az ad app list `
  --query ("[?appId=='{0}'][].api.oauth2PermissionScopes[?value=='{1}'][].id" -f $apiAppRegistrationClientId, $constants.apiAdminScopeValue) `
  --output tsv

$requiredResourceAccesses = @(
  @{
    # User.Read scope for Microsoft Graph app
    resourceAppId  = '00000003-0000-0000-c000-000000000000'
    resourceAccess = @(@{
        id   = 'e1fe6dd8-ba31-4d61-89e7-88639da4683d'
        type = 'Scope'
      }
    )
  }
  @{
    # Admin scope for API app
    resourceAppId  = $apiAppRegistrationClientId
    resourceAccess = @(@{
        id   = $apiAdminScopeId
        type = 'Scope'
      }
    )
  }
)

$requiredResourceAccessesJson = (ConvertTo-Json -InputObject $requiredResourceAccesses -Depth 10 -Compress) -replace '"', '\"'

az ad app update `
  --id $appRegistrationClientId `
  --required-resource-accesses $requiredResourceAccessesJson `
  --public-client-redirect-uris $RedirectUrl `
  --output none

Write-Output 'Set API permissions and redirect URLs'

if (-not $SkipAdminConsent) {
  Write-Output 'Granting admin consent...'

  az ad app permission admin-consent `
    --id $appRegistrationClientId `
    --output none

  Write-Output 'Granted admin consent'
}
