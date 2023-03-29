[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

  [Parameter(Mandatory = $true)]
  [string]
  $IdentifierUri,

  [Parameter()]
  [switch]
  $SkipAdminConsent
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  appRolesFile                = Join-Path -Path $PSScriptRoot -ChildPath 'api-app-roles.json'
  requestedResourceAccessFile = Join-Path -Path $PSScriptRoot -ChildPath 'api-requested-resource-accesses.json'
  scopesFile                  = Join-Path -Path $PSScriptRoot -ChildPath 'api-scopes.json'
  optionalClaimsFile          = Join-Path -Path $PSScriptRoot -ChildPath 'api-optional-claims.json'
}

#
# Create API app registration if it doesn't exist
#
$appRegistration = az ad app list --display-name $Name --output tsv
if ($appRegistration) {
  Write-Output ('API app registration ''{0}'' already exists' -f $Name)
} else {
  Write-Output ('Creating API app registration ''{0}''...' -f $Name)

  az ad app create `
    --display-name $Name `
    --sign-in-audience AzureADMyOrg `
    --output none

  Write-Output ('Created API app registration ''{0}''' -f $Name)
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
Write-Output 'Setting identifier URI, API permissions, app roles, and optional claims...'

$apiPermissionsPayload = @(
  @{
    # VerifiableCredentials.Create.All role for Verifiable Credentials Service Request app
    # See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/verifiable-credentials-configure-tenant#grant-permissions-to-get-access-tokens
    resourceAppId  = '3db474b9-6a0c-4840-96ac-1fceb342124f'
    resourceAccess = @(
      @{
        id   = '949ebb93-18f8-41b4-b677-c2bfea940027'
        type = 'Role'
      }
    )
  }
  @{
    # full_access scope for Verifiable Credentials Service Admin app
    # See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#authentication
    resourceAppId  = '6a8b4b39-c021-437c-b060-5a14a3fd65f3'
    resourceAccess = @(
      @{
        id   = 'f4922361-5b56-4b3b-808f-a25115425e16'
        type = 'Scope'
      }
    )
  }
)

az ad app update `
  --id $appRegistrationClientId `
  --identifier-uris $IdentifierUri `
  --required-resource-accesses ((ConvertTo-Json -InputObject $apiPermissionsPayload -Compress -Depth 10) -replace '"', '\"') `
  --app-roles ('@{0}' -f $constants.appRolesFile) `
  --optional-claims ('@{0}' -f $constants.optionalClaimsFile) `
  --output none

Write-Output 'Set identifier URI, API permissions, app roles, and optional claims'

#
# Nothing built in for scopes, and az ad app update doesn't work
# See:
#   - https://github.com/Azure/azure-cli/issues/23444#issuecomment-1205987288
#   - https://github.com/Azure/azure-cli/issues/22580
#   - https://learn.microsoft.com/en-us/graph/api/application-update?view=graph-rest-1.0&tabs=http#request-body
#
# -NoEnumerate prevents ConvertFrom-Json from transforming an array with a single element into an object
# See https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/convertfrom-json?view=powershell-7.3#example-5-round-trip-a-single-element-array
#
$scopesFileContent = Get-Content -Path $constants.scopesFile -Raw
$scopes = ConvertFrom-Json -InputObject $scopesFileContent -Depth 10 -NoEnumerate
$setScopesPayload = @{
  api = @{
    oauth2PermissionScopes = $scopes
  }
}

$setScopesPayloadJson = ($setScopesPayload | ConvertTo-Json -Depth 10 -Compress) -replace '"', '\"'

Write-Output 'Setting scopes...'

az rest `
  --method patch `
  --url ('https://graph.microsoft.com/v1.0/applications/{0}' -f $appRegistrationClientId) `
  --body $setScopesPayloadJson `
  --output none

Write-Output 'Set scopes'

if (-not $SkipAdminConsent) {
  Write-Output 'Granting admin consent...'

  az ad app permission admin-consent `
    --id $appRegistrationClientId `
    --output none

  Write-Output 'Granted admin consent'
}

Write-Output ('Link to app registration in Azure Portal: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/{0}/isMSAApp~/false' -f $appRegistrationClientId)
