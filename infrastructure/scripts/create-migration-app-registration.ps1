[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name
)

. (Join-Path $PSScriptRoot 'shared-utils.ps1')

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
$preExisting = $null
$appRegistration = Invoke-WithRetry -ScriptBlock {
  az ad app list --display-name $Name --query "[0]" | ConvertFrom-Json
}

if ($appRegistration) {
  Write-Output ('Migration app registration ''{0}'' already exists' -f $Name)
  $preExisting = $true
} else {
  Write-Output ('Creating Migration app registration ''{0}''...' -f $Name)

  $appRegistration = Invoke-WithRetry -ScriptBlock {
    az ad app create `
      --display-name $Name `
      --sign-in-audience AzureADMyOrg | ConvertFrom-Json
  }

  Write-Output ('Created Migration app registration ''{0}''' -f $Name)
}

# Entra operations are shown to be unreliable even when using the object ID immediately after creation
# so we sleep for a bit to allow the operation to propagate
if (-not $preExisting) {
  Start-Sleep -Seconds 20
}
$appRegistrationObjectId = $appRegistration.id
$appRegistrationAppId = $appRegistration.appId

#
# Service principal
#
$servicePrincipal = Invoke-WithRetry -ScriptBlock {
  az ad sp list --display-name $Name --query "[0].id" --output tsv
}

if (-not [string]::IsNullOrWhiteSpace($servicePrincipal)) {
  Write-Output ('Found an existing service principal named ''{0}''' -f $Name)
} else {
  Write-Output ('Creating a new service principal named ''{0}''...' -f $Name)

  Invoke-WithRetry -ScriptBlock {
    az ad sp create --id $appRegistrationObjectId --output none
  }

  Write-Output ('Created a new service principal named ''{0}''' -f $Name)
}

$credentials = Invoke-WithRetry -ScriptBlock {
  az ad app federated-credential list --id $appRegistrationObjectId | ConvertFrom-Json -NoEnumerate
}
$credential = $credentials | Where-Object -FilterScript { $_.name -eq $credentialDetails.name }

if ($null -ne $credential) {
  Write-Output ('Found an existing federated credential named ''{0}''' -f $credential.name)
} else {
  Write-Output ('Creating a new federated credential named ''{0}''' -f $credentialDetails.name)

  Invoke-WithRetry -ScriptBlock {
    az ad app federated-credential create --id $appRegistrationObjectId --parameters ('@{0}' -f $constants.credentialFile) --output none
  }

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
