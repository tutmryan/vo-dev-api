[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

#
# Delete API app registration if it exists
#
$appRegistration = az ad app list --display-name $Name | ConvertFrom-Json

if ($appRegistration) {
  Write-Output ('Deleting API app registration ''{0}''...' -f $Name)

  az ad app delete --id $appRegistration.id

  Write-Output ('Deleted API app registration ''{0}'' ✅' -f $Name)
} else {
  Write-Output ('API app registration ''{0}'' does not exist' -f $Name)
}

