[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name
)

. (Join-Path $PSScriptRoot 'shared-utils.ps1')

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

#
# Delete API app registration if it exists
#
$appRegistration = Invoke-WithRetry -ScriptBlock {
  az ad app list --display-name $Name | ConvertFrom-Json
}

if ($appRegistration) {
  Write-Output ('Deleting API app registration ''{0}''...' -f $Name)

  Invoke-WithRetry -ScriptBlock {
    az ad app delete --id $appRegistration.id
  }

  Write-Output ('Deleted API app registration ''{0}'' ✅' -f $Name)
} else {
  Write-Output ('API app registration ''{0}'' does not exist' -f $Name)
}

