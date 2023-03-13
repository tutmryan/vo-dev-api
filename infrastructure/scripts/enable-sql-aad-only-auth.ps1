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
  Write-Error ('Unable to find an Azure SQL instance named ''{0}'' in resource group ''{1}''' -f $AzureSqlInstanceName, $ResourceGroupName)
}

$isAadOnlyAuthEnabled = az sql server ad-only-auth get `
  --resource-group $ResourceGroupName `
  --name $AzureSqlInstanceName `
  --query "azureAdOnlyAuthentication" `
  --output tsv

if ($isAadOnlyAuthEnabled -eq 'true') {
  Write-Output ('AAD-only auth is already enabled on Azure SQL instance named ''{0}''' -f $AzureSqlInstanceName)
  exit 0
}

az sql server ad-only-auth enable `
  --resource-group $ResourceGroupName `
  --name $AzureSqlInstanceName `
  --only-show-errors `
  --output none

Write-Output ('AAD-only auth has been enabled on Azure SQL instance named ''{0}''' -f $AzureSqlInstanceName)
