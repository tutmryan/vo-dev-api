[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  credentialFile = Join-Path -Path $PSScriptRoot -ChildPath 'migration-app-federated-credential.json'
  roleName       = "Storage Blob Data Reader"
}
$credentialDetails = Get-Content $constants.credentialFile | ConvertFrom-Json
#
# Create migration app registration if it doesn't exist
#
$appRegistration = az ad app list --display-name $Name --output tsv
if ($appRegistration) {
  Write-Output ('Migration app registration ''{0}'' already exists' -f $Name)
} else {
  Write-Output ('Creating Migration app registration ''{0}''...' -f $Name)

  az ad app create `
    --display-name $Name `
    --sign-in-audience AzureADMyOrg `
    --output none

  Write-Output ('Created Migration app registration ''{0}''' -f $Name)
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

$credentials = az ad app federated-credential list --id $appRegistrationObjectId | ConvertFrom-Json -NoEnumerate
$credential = $credentials | Where-Object -FilterScript { $_.name -eq $credentialDetails.name }

if ($null -ne $credential) {
  Write-Output ('Found an existing federated credential named ''{0}''' -f $credential.name)
} else {
  Write-Output ('Creating a new federated credential named ''{0}''' -f $credentialDetails.name)

  az ad app federated-credential create --id $appRegistrationObjectId --parameters ('@{0}' -f $constants.credentialFile) --output none

  Write-Output ('Created a new federated credential named ''{0}''' -f $credentialDetails.name)
}

Write-Output "migrationAppName=$($Name)" >> $Env:GITHUB_OUTPUT
Write-Output "migrationAppObjectId=$($appRegistrationObjectId)" >> $Env:GITHUB_OUTPUT
Write-Output "migrationAppId=$($appRegistrationAppId)" >> $Env:GITHUB_OUTPUT

return @{
  migrationAppName     = $Name
  migrationAppObjectId = $appRegistrationObjectId
  migrationAppId       = $appRegistrationAppId
}

