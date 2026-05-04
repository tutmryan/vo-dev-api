[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $ActionGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $SharedResourceGroupName
)

. (Join-Path $PSScriptRoot 'shared-utils.ps1')

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$actionGroup = Invoke-WithRetry -ScriptBlock {
  az monitor action-group list `
    --resource-group $SharedResourceGroupName | `
    ConvertFrom-Json | `
    Where-Object -FilterScript { $_.name -eq $ActionGroupName }[0]
}

if ($null -ne $actionGroup) {
  Write-Output "Action group '$($actionGroup.name)' was found in the resource group '$($SharedResourceGroupName)'."
  Write-Output "actionGroupName=$($actionGroup.name)" >> $Env:GITHUB_OUTPUT
} else {
  Write-Output "Action group '$($ActionGroupName)' not found."
}
