[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $SqlServerName,

  [Parameter(Mandatory = $true)]
  [string]
  $DatabaseName
)

. (Join-Path $PSScriptRoot 'shared-utils.ps1')

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

# Check if the database exists
Write-Output "Checking if database '$DatabaseName' exists on server '$SqlServerName' in resource group '$ResourceGroupName'..."

$database = Invoke-WithRetry -ScriptBlock {
  az sql db list `
    --resource-group $ResourceGroupName `
    --server $SqlServerName `
    --query "[?name=='$DatabaseName'].name" `
    --output tsv
}

if ($database -eq $DatabaseName) {
  Write-Output "Deleting SQL database '$DatabaseName' from server '$SqlServerName' in resource group '$ResourceGroupName'..."

  # Delete the database
  Invoke-WithRetry -ScriptBlock {
    az sql db delete `
      --resource-group $ResourceGroupName `
      --server $SqlServerName `
      --name $DatabaseName `
      --yes
  }

  Write-Output "Deleted SQL database '$DatabaseName' ✅"
} else {
  Write-Output "SQL database '$DatabaseName' does not exist on server '$SqlServerName' ❌"
}
