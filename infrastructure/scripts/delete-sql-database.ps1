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

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

# Check if the database exists
Write-Output "Checking if database '$DatabaseName' exists on server '$SqlServerName' in resource group '$ResourceGroupName'..."

try {
  $database = az sql db show `
    --resource-group $ResourceGroupName `
    --server $SqlServerName `
    --name $DatabaseName `
    --query 'name' `
    --output tsv 2>$null

  if ($database -eq $DatabaseName) {
    Write-Output "Deleting SQL database '$DatabaseName' from server '$SqlServerName' in resource group '$ResourceGroupName'..."

    # Delete the database
    az sql db delete `
      --resource-group $ResourceGroupName `
      --server $SqlServerName `
      --name $DatabaseName `
      --yes

    Write-Output "Deleted SQL database '$DatabaseName' ✅"
  } else {
    Write-Output "SQL database '$DatabaseName' does not exist on server '$SqlServerName' ❌"
  }
} catch {
  Write-Output "SQL database '$DatabaseName' does not exist on server '$SqlServerName' ❌"
}
