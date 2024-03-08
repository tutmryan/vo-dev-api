[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

  [Parameter(Mandatory = $true)]
  [string]
  $IdentifierUri
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  appRolesFile = Join-Path -Path $PSScriptRoot -ChildPath 'app-roles.json'
  scopesFile   = Join-Path -Path $PSScriptRoot -ChildPath 'app-scopes.json'
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
    --sign-in-audience AzureADMultipleOrgs `
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
Write-Output 'Setting identifier URI, and app roles...'

az ad app update `
  --id $appRegistrationClientId `
  --identifier-uris $IdentifierUri `
  --app-roles ('@{0}' -f $constants.appRolesFile)


Write-Output 'Set identifier URI, and app roles'

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

$setScopesPayloadJson = ($setScopesPayload | ConvertTo-Json -Depth 10 -Compress)
Write-Output 'Setting scopes...'

az rest `
  --method patch `
  --headers Content-Type=application/json `
  --url ('https://graph.microsoft.com/v1.0/applications/{0}' -f $appRegistrationClientId) `
  --body $setScopesPayloadJson

Write-Output 'Set scopes'


$setVerifiedPublisherPayload = @{
  verifiedPublisherId = "6659076"
}
$setVerifiedPublisherPayloadJson = ($setVerifiedPublisherPayload | ConvertTo-Json -Depth 10 -Compress)
Write-Output 'Setting verified publisher ID...'

az rest `
  --method post `
  --headers Content-Type=application/json `
  --url ('https://graph.microsoft.com/beta/applications/{0}/setVerifiedPublisher' -f $appRegistrationClientId) `
  --body $setVerifiedPublisherPayloadJson

Write-Output 'Set verified publisher ID'
