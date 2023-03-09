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
  clientSecretDescription     = 'Generated with create-api-app-registration.ps1'
  appRolesFile                = Join-Path -Path $PSScriptRoot -ChildPath 'api-app-roles.json'
  requestedResourceAccessFile = Join-Path -Path $PSScriptRoot -ChildPath 'api-requested-resource-accesses.json'
  scopesFile                  = Join-Path -Path $PSScriptRoot -ChildPath 'api-scopes.json'
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

$appRegistrationId = az ad app list --query ("[?displayName=='{0}'].id" -f $Name) --output tsv

#
# Set properties
#
Write-Output 'Setting identifier URI, API permissions, and app roles...'

az ad app update `
  --id $appRegistrationId `
  --identifier-uris $IdentifierUri `
  --required-resource-accesses ('@{0}' -f $constants.requestedResourceAccessFile) `
  --app-roles ('@{0}' -f $constants.appRolesFile) `
  --output none

Write-Output 'Set identifier URI, API permissions, and app roles'

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
$scopes = Get-Content -Path $constants.scopesFile -Raw | ConvertFrom-Json -Depth 10 -NoEnumerate
$setScopesPayload = @{
  api = @{
    oauth2PermissionScopes = $scopes
  }
}

$setScopesPayloadJson = ($setScopesPayload | ConvertTo-Json -Depth 10 -Compress) -replace '"', '\"'

Write-Output 'Setting scopes...'

az rest `
  --method patch `
  --url ('https://graph.microsoft.com/v1.0/applications/{0}' -f $appRegistrationId) `
  --body $setScopesPayloadJson `
  --output none

Write-Output 'Set scopes'

$credential = az ad app show `
  --id $appRegistrationId `
  --query ("passwordCredentials[?displayName=='{0}']" -f $constants.clientSecretDescription) `
  --output tsv

if ($null -ne $credential) {
  Write-Output ('Found an existing client secret named ''{0}''' -f $constants.clientSecretDescription)
} else {

  Write-Output 'Generating a new client secret...'

  $clientSecret = az ad app credential reset `
    --id $appRegistrationId `
    --append `
    --display-name $constants.clientSecretDescription `
    --years 1 `
    --only-show-errors `
    --query "password" `
    --output tsv

  Write-Output ('New client secret generated with a lifetime of 1 year: {0}' -f $clientSecret)
}

if (-not $SkipAdminConsent) {
  Write-Output 'Granting admin consent...'

  az ad app permission admin-consent `
    --id $appRegistrationId `
    --output none

  Write-Output 'Granted admin consent'
}
