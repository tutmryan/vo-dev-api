[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $AzureSqlInstanceName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$azureSqlInstances = az sql server list --resource-group $ResourceGroupName --query "[].name" --output tsv
if ($azureSqlInstances -notcontains $AzureSqlInstanceName) {
  Write-Output ('Unable to find an Azure SQL instance named ''{0}'' in resource group ''{1}''. Skipping...' -f $AzureSqlInstanceName, $ResourceGroupName)
  exit 0
}

$isAadOnlyAuthEnabled = az sql server ad-only-auth get `
  --resource-group $ResourceGroupName `
  --name $AzureSqlInstanceName `
  --query "azureAdOnlyAuthentication" `
  --output tsv

if ($isAadOnlyAuthEnabled -eq 'false') {
  Write-Output ('AAD-only auth is already disabled on Azure SQL instance named ''{0}''. Skipping...' -f $AzureSqlInstanceName)
  exit 0
}

az sql server ad-only-auth disable `
  --resource-group $ResourceGroupName `
  --name $AzureSqlInstanceName `
  --only-show-errors `
  --output none

Write-Output ('AAD-only auth has been disabled on Azure SQL instance named ''{0}''' -f $AzureSqlInstanceName)
