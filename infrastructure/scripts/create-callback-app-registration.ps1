[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

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
  # This needs to match the value of the scope in api-app-roles.json and api config
  apiAppRole = 'VerifiableCredential.Request.Callback'
}

$apiAppRegistrationClientId = az ad app list --query ("[?displayName=='{0}'].appId" -f $ApiAppRegistrationName) --output tsv
if ($null -eq $apiAppRegistrationClientId) {
  throw ('Unable to find the API app registration named ''{0}''' -f $ApiAppRegistrationName)
}

#
# Create Callback app registration if it doesn't exist
#
$appRegistration = az ad app list --display-name $Name --output tsv
if ($appRegistration) {
  Write-Output ('Callback app registration ''{0}'' already exists' -f $Name)
} else {
  Write-Output ('Creating Callback app registration ''{0}''...' -f $Name)

  az ad app create `
    --display-name $Name `
    --sign-in-audience AzureADMyOrg `
    --output none

  Write-Output ('Created Callback app registration ''{0}''' -f $Name)
}

$appRegistrationClientId = az ad app list --query ("[?displayName=='{0}'].id" -f $Name) --output tsv

# TODO: automate app role setting for VerifiableCredential.Request.Callback app role
#
# Set properties
#
# Write-Output 'Setting API permissions and redirect URLs'

# $apiAdminScopeId = az ad app list `
#   --query ("[?appId=='{0}'][].api.oauth2PermissionScopes[?value=='{1}'][].id" -f $apiAppRegistrationClientId, $constants.apiAdminScopeValue) `
#   --output tsv

# $requiredResourceAccesses = @(
#   @{
#     # User.Read scope for Microsoft Graph app
#     resourceAppId  = '00000003-0000-0000-c000-000000000000'
#     resourceAccess = @(@{
#         id   = 'e1fe6dd8-ba31-4d61-89e7-88639da4683d'
#         type = 'Scope'
#       }
#     )
#   }
#   @{
#     # Admin scope for API app
#     resourceAppId  = $apiAppRegistrationClientId
#     resourceAccess = @(@{
#         id   = $apiAdminScopeId
#         type = 'Scope'
#       }
#     )
#   }
# )

# $requiredResourceAccessesJson = (ConvertTo-Json -InputObject $requiredResourceAccesses -Depth 10 -Compress) -replace '"', '\"'

# az ad app update `
#   --id $appRegistrationClientId `
#   --required-resource-accesses $requiredResourceAccessesJson `
#   --web-redirect-uris $RedirectUrl `
#   --output none

# Write-Output 'Set API permissions and redirect URLs'

# if (-not $SkipAdminConsent) {
#   Write-Output 'Granting admin consent...'

#   az ad app permission admin-consent `
#     --id $appRegistrationClientId `
#     --output none

#   Write-Output 'Granted admin consent'
# }

Write-Output ('Link to app registration in Azure Portal: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/{0}/isMSAApp~/false' -f $appRegistrationClientId)
