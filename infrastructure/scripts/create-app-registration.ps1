[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  appRolesFile                = Join-Path -Path $PSScriptRoot -ChildPath 'app-roles.json'
  requestedResourceAccessFile = Join-Path -Path $PSScriptRoot -ChildPath 'app-requested-resource-accesses.json'
  apiSecretName               = 'Secret for API to call VID'
  staticSiteSecretName        = 'Secret for static site AUTH'
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

$appRegistration = az ad app list --display-name $Name | ConvertFrom-Json
$appRegistrationObjectId = $appRegistration.id
$appRegistrationAppId = $appRegistration.appId

#
# Service principal
#
$servicePrincipal = az ad sp list --display-name $Name --output tsv
if ($null -ne $servicePrincipal) {
  Write-Output ('Found an existing service principal named ''{0}''' -f $Name)
} else {
  Write-Output ('Creating a new service principal named ''{0}''...' -f $Name)

  az ad sp create --id $appRegistrationObjectId --output none

  Write-Output ('Created a new service principal named ''{0}''' -f $Name)
}

#
# Set properties
#
Write-Output 'Setting app roles and enabling id token issuance...'

az ad app update `
  --id $appRegistrationObjectId `
  --required-resource-accesses ('@{0}' -f $constants.requestedResourceAccessFile)`
  --app-roles ('@{0}' -f $constants.appRolesFile) `
  --enable-id-token-issuance $true

Write-Output 'Set app roles and enabling id token issuance...'


$apiSecret = az ad app credential list `
  --id $appRegistrationObjectId | `
  ConvertFrom-Json | `
  Where-Object -FilterScript { $_.displayName -eq $constants.apiSecretName }[0]

if ($null -ne $apiSecret) {
  Write-Output ('Found an existing API secret expiring on {0}' -f $apiSecret.endDateTime)
} else {
  Write-Output ('Creating a new API secret')

  $newApiSecret = az ad app credential reset `
    --append `
    --id $appRegistrationObjectId `
    --display-name $constants.apiSecretName `
    --years 2 | ConvertFrom-Json

  Write-Output ('Created a new API secret')
  Write-Output "apiSecret=$($newApiSecret.password)" >> $Env:GITHUB_OUTPUT
}


$staticStiteSecret = az ad app credential list `
  --id $appRegistrationObjectId | `
  ConvertFrom-Json | `
  Where-Object -FilterScript { $_.displayName -eq $constants.staticSiteSecretName }[0]
if ($null -ne $staticStiteSecret) {
  Write-Output ('Found an existing static site AUTH secret expiring on {0}' -f $staticStiteSecret.endDateTime)
} else {
  Write-Output ('Creating a new static site AUTH secret')
  $newStaticSiteSecret = az ad app credential reset `
    --append `
    --id $appRegistrationObjectId `
    --display-name $constants.staticSiteSecretName `
    --years 2 |  ConvertFrom-Json

  Write-Output ('Created a new static site AUTH secret')
  Write-Output "staticSiteSecret=$($newStaticSiteSecret.password)" >> $Env:GITHUB_OUTPUT
}

# $setVerifiedPublisherPayload = @{
#   verifiedPublisherId = "6659076"
# }
# $setVerifiedPublisherPayloadJson = ($setVerifiedPublisherPayload | ConvertTo-Json -Depth 10 -Compress)
# Write-Output 'Setting verified publisher ID...'

# az rest `
#   --method post `
#   --headers Content-Type=application/json `
#   --url ('https://graph.microsoft.com/v1.0/applications/{0}/setVerifiedPublisher' -f $appRegistrationObjectId) `
#   --body $setVerifiedPublisherPayloadJson

# Write-Output 'Set verified publisher ID'

Write-Output "instanceAppId=$($appRegistrationAppId)" >> $Env:GITHUB_OUTPUT
