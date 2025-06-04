[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

  [Parameter(Mandatory = $true)]
  [string]
  $HomePageUrl
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  appRolesFile                = Join-Path -Path $PSScriptRoot -ChildPath 'app-roles.json'
  requestedResourceAccessFile = Join-Path -Path $PSScriptRoot -ChildPath 'app-requested-resource-accesses.json'
  apiSecretName               = 'Secret for API to call VID'
  staticSiteSecretName        = 'Secret for static site AUTH'
  privacyStatementUrl         = 'https://verifiedorchestration.com/privacy-policy/'
  termsOfServiceUrl           = 'https://verifiedorchestration.com/terms-and-conditions/'
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
    --web-home-page-url $HomePageUrl `
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
  --enable-id-token-issuance $true `
  --web-home-page-url $HomePageUrl

Write-Output 'Set app roles and enabling id token issuance...'


function Test-SecretExpiringSoon {
  param (
    [Parameter(Mandatory = $true)]
    [string]$EndDateTime,
    [int]$ThresholdDays = 90
  )

  $expiry = [datetime]::Parse($EndDateTime)
  return (($expiry - (Get-Date)).TotalDays -lt $ThresholdDays)
}

function Set-AppSecretIfExpired {
  param (
    [Parameter(Mandatory = $true)][string]$AppId,
    [Parameter(Mandatory = $true)][string]$SecretName,
    [Parameter(Mandatory = $true)][string]$EnvOutputKey
  )

  $secret = az ad app credential list --id $AppId | ConvertFrom-Json |
  Where-Object { $_.displayName -eq $SecretName } | Select-Object -First 1

  if (-not $secret -or (Test-SecretExpiringSoon -EndDateTime $secret.endDateTime)) {
    Write-Output ('{0} secret is missing or expiring soon. Rotating...' -f $SecretName)
    $newSecret = az ad app credential reset `
      --append `
      --id $AppId `
      --display-name $SecretName `
      --years 2 | ConvertFrom-Json

    Write-Output "Created new $SecretName secret"
    Write-Output "$EnvOutputKey=$($newSecret.password)" >> $Env:GITHUB_OUTPUT
  } else {
    Write-Output ('Found valid existing {0} secret expiring on {1}' -f $SecretName, $secret.endDateTime)
  }
}

Set-AppSecretIfExpired -AppId $appRegistrationObjectId -SecretName $constants.apiSecretName -EnvOutputKey 'apiSecret'
Set-AppSecretIfExpired -AppId $appRegistrationObjectId -SecretName $constants.staticSiteSecretName -EnvOutputKey 'staticSiteSecret'

$setInformationalUrlsPayload = @{
  info = @{
    privacyStatementUrl = $constants.privacyStatementUrl
    termsOfServiceUrl   = $constants.termsOfServiceUrl
  }
}
$setInformationalUrlsPayloadJson = ($setInformationalUrlsPayload  | ConvertTo-Json -Depth 10 -Compress)
Write-Output 'Setting privacy statement and terms of service urls...'

az rest `
  --method patch `
  --headers Content-Type=application/json `
  --url ('https://graph.microsoft.com/v1.0/applications/{0}' -f $appRegistrationObjectId) `
  --body $setInformationalUrlsPayloadJson

Write-Output 'Set privacy statement and terms of service urls...'

# Setting verified publisher needs to be done manually via the Azure Portal.
# Token received by the Azure CLI, `az login`, does not seem to have necessary scopes to call `setVerifiedPublisher` endpoint.
# The call fails with `Forbidden` error message.
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

return @{
  instanceAppName     = $Name
  instanceAppObjectId = $appRegistrationObjectId
  instanceAppId       = $appRegistrationAppId
}
