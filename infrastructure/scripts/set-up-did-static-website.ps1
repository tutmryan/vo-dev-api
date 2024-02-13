[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $StorageAccountName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

#
# Enable static website on the storage account
#
Write-Output ('Enabling static website on storage account ''{0}''...' -f $StorageAccountName)
az storage blob service-properties update `
  --account-name $StorageAccountName `
  --static-website `
  --only-show-errors `
  --output none
Write-Output ('Enabled static website on storage account ''{0}''' -f $StorageAccountName)

#
# Get storage account web endpoint
#
Write-Output ('Getting web endpoint for storage account ''{0}''...' -f $StorageAccountName)
$storageAccountWebEndpoint = az storage account show `
  --name $StorageAccountName `
  --query 'primaryEndpoints.web' `
  --output tsv
Write-Output ('Got web endpoint for storage account ''{0}'': {1}' -f $StorageAccountName, $storageAccountWebEndpoint)

$storageAccountWebEndpointDomainName = New-Object -TypeName 'UriBuilder' -ArgumentList $storageAccountWebEndpoint | Select-Object -ExpandProperty Host

Write-Output "storageAccountWebEndpointDomainName=$($storageAccountWebEndpointDomainName)" >> $Env:GITHUB_OUTPUT
