[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

  [Parameter(Mandatory = $true)]
  [string]
  $HomePageUrl,

  [Parameter(Mandatory = $true)]
  [string] $LogoPath
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

Write-Output 'Set app roles and enabled id token issuance.'

#
# API scope and Application ID URI
#
Write-Output 'Configuring API scope and Application ID URI...'
$graphApp = az rest `
  --method get `
  --url ("https://graph.microsoft.com/v1.0/applications/{0}" -f $appRegistrationObjectId) | ConvertFrom-Json

$identifierUris = @("api://$appRegistrationAppId")

# Safe reset behaviour
# - Always set the Application ID URI to api://<objectId> so the scope identifier is stable.
# - Preserve existing consent by reusing the existing 'user.access' scope GUID if present.
# - Replace the API's scopes with exactly one 'user.access' scope configured below.
$existingScopes = @()
if ($null -ne $graphApp.api -and $null -ne $graphApp.api.oauth2PermissionScopes) {
  $existingScopes = $graphApp.api.oauth2PermissionScopes
}

$scopeValue = 'user.access'
$existingScope = $null
if ($existingScopes) {
  $existingScope = $existingScopes | Where-Object { $_.value -eq $scopeValue } | Select-Object -First 1
}
if ($null -eq $existingScope) {
  $scopeId = ([guid]::NewGuid()).ToString()

  $newScope = @{
    id                         = $scopeId
    value                      = $scopeValue
    type                       = 'Admin'
    isEnabled                  = $true
    adminConsentDisplayName    = 'Access the API as the signed-in user'
    adminConsentDescription    = "Allows this application to call the API on behalf of the signed-in user and include the user's role assignments in the access token."
    userConsentDisplayName     = 'Access this API using your account'
    userConsentDescription     = 'Lets the app act on your behalf using your existing permissions and roles.'
  }

  $updatedScopes = @()
  if ($existingScopes -and $existingScopes.Count -gt 0) {
    foreach ($s in $existingScopes) {
      $id = [string]$s.id
      $val = if ($null -ne $s.value -and -not [string]::IsNullOrWhiteSpace([string]$s.value)) { [string]$s.value } else { "scope" }
      $t = if ($null -ne $s.type -and -not [string]::IsNullOrWhiteSpace([string]$s.type)) { [string]$s.type } else { "User" }
      $adminDn = if ($null -ne $s.adminConsentDisplayName -and -not [string]::IsNullOrWhiteSpace([string]$s.adminConsentDisplayName)) { [string]$s.adminConsentDisplayName } else { "Admin consent for $val" }
      $adminDd = if ($null -ne $s.adminConsentDescription -and -not [string]::IsNullOrWhiteSpace([string]$s.adminConsentDescription)) { [string]$s.adminConsentDescription } else { "Required for administrators to consent to $val." }
      $userDn = if ($null -ne $s.userConsentDisplayName -and -not [string]::IsNullOrWhiteSpace([string]$s.userConsentDisplayName)) { [string]$s.userConsentDisplayName } else { "User consent for $val" }
      $userDd = if ($null -ne $s.userConsentDescription -and -not [string]::IsNullOrWhiteSpace([string]$s.userConsentDescription)) { [string]$s.userConsentDescription } else { "Allows user consent to $val." }
      $updatedScopes += @{
        id                      = $id
        value                   = $val
        type                    = $t
        isEnabled               = [bool]$s.isEnabled
        adminConsentDisplayName = $adminDn
        adminConsentDescription = $adminDd
        userConsentDisplayName  = $userDn
        userConsentDescription  = $userDd
      }
    }
  }
  $updatedScopes += $newScope

  $patchPayload = @{ api = @{ oauth2PermissionScopes = $updatedScopes } }
  $patchPayloadJson = ($patchPayload | ConvertTo-Json -Depth 10 -Compress)

  az rest `
    --method patch `
    --headers Content-Type=application/json `
    --url ("https://graph.microsoft.com/v1.0/applications/{0}" -f $appRegistrationObjectId) `
    --body $patchPayloadJson

  Write-Output ("Created API scope '{0}'." -f $scopeValue)
} else {
  Write-Output ("API scope '{0}' already exists. No changes made." -f $scopeValue)
}

#
# Set secrets
#
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

Write-Output ("Uploading app logo")
$token = az account get-access-token --resource https://graph.microsoft.com --query accessToken -o tsv
$appId = $appRegistrationObjectId
$url = "https://graph.microsoft.com/v1.0/applications/$appId/logo"
$headers = @(
  "--header", "Authorization: Bearer $token"
  "--header", "Content-Type: image/png"
)
$curlArgs = @(
  "--request", "PUT"
  $headers
  "--data-binary", "@$LogoPath"
  $url
)
& curl @curlArgs
Write-Output "Uploaded app logo"

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
