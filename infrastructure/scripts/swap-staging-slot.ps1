[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $AppServiceName,

  [Parameter(Mandatory = $false)]
  [string]
  $SourceSlotName = 'staging',

  [Parameter(Mandatory = $false)]
  [string]
  $TargetSlotName = 'production'
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

Write-Host "Swapping slot '$SourceSlotName' to '$TargetSlotName' for '$AppServiceName'"

az webapp deployment slot swap `
  --resource-group $ResourceGroupName `
  --name $AppServiceName `
  --slot $SourceSlotName `
  --target-slot $TargetSlotName

Write-Host "Stopping slot '$SourceSlotName' for '$AppServiceName'"

az webapp stop `
  --resource-group $ResourceGroupName `
  --name $AppServiceName `
  --slot $SourceSlotName
