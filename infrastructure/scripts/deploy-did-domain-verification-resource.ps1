[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

function GetDeploymentName([string]$Suffix) {
  $now = Get-Date -AsUTC
  '{0}-{1}-verified-id-domain-verification-{2}' -f $now.ToString('yyyyMMdd'), $now.ToString('hhMMss'), $Suffix
}

$constants = @{
  storageBicepFile   = Join-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -ChildPath 'verified-id-domain-verification-storage.bicep'
  storageAccountName = 'vovrfdiddmnvrfctn'

  cdnBicepFile       = Join-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -ChildPath 'verified-id-domain-verification-cdn.bicep'
  cdnProfileName     = 'vo-vrfdid-domain-verification-cdn'
}

#
# Deploy storage account
#
Write-Output ('Deploying storage account ''{0}''...' -f $constants.storageAccountName)
$storageDeploymentName = GetDeploymentName -Suffix 'storage'
az deployment group create `
  --resource-group $ResourceGroupName `
  --name $storageDeploymentName `
  --template-file $constants.storageBicepFile `
  --mode Incremental `
  --parameters storageAccountName=$($constants.storageAccountName) `
  --output none
Write-Output ('Deployed storage account ''{0}''' -f $constants.storageAccountName)

#
# Enable static website on the storage account
#
Write-Output ('Enabling static website on storage account ''{0}''...' -f $constants.storageAccountName)
az storage blob service-properties update `
  --account-name $constants.storageAccountName `
  --static-website `
  --only-show-errors `
  --output none
Write-Output ('Enabled static website on storage account ''{0}''' -f $constants.storageAccountName)

#
# Get storage account web endpoint
#
Write-Output ('Getting web endpoint for storage account ''{0}''...' -f $constants.storageAccountName)
$storageAccountWebEndpoint = az storage account show `
  --name $constants.storageAccountName `
  --query 'primaryEndpoints.web' `
  --output tsv
Write-Output ('Got web endpoint for storage account ''{0}'': {1}' -f $constants.storageAccountName, $storageAccountWebEndpoint)

$storageAccountWebEndpointDomainName = New-Object -TypeName 'UriBuilder' -ArgumentList $storageAccountWebEndpoint | Select-Object -ExpandProperty Host

#
# Deploy CDN endpoint and profile
#
Write-Output ('Deploying CDN profile ''{0}''...' -f $constants.cdnProfileName)
$cdnDeploymentName = GetDeploymentName -Suffix 'cdn'
az deployment group create `
  --resource-group $ResourceGroupName `
  --name $cdnDeploymentName `
  --template-file $constants.cdnBicepFile `
  --mode Incremental `
  --parameters cdnProfileName=$($constants.cdnProfileName) `
  --parameters storageAccountWebEndpointDomainName=$storageAccountWebEndpointDomainName `
  --output none
Write-Output ('Deployed CDN profile ''{0}''' -f $constants.cdnProfileName)
