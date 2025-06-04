[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $ResourcePrefix
)

$ErrorActionPreference = 'Stop'

$webTestsToDelete = @(
  "$ResourcePrefix-msgraphservice-health-test",
  "$ResourcePrefix-vidservice-health-test",
  "$ResourcePrefix-oidc-availability-test"
)

$alertsToDelete = @(
  "$ResourcePrefix-msgraphservice-health-alert",
  "$ResourcePrefix-vidservice-health-alert",
  "$ResourcePrefix-oidc-availability-alert"
)

$foundAny = $false

foreach ($name in $webTestsToDelete) {
  $testId = az resource show `
    --resource-group $ResourceGroupName `
    --resource-type "Microsoft.Insights/webtests" `
    --name $name `
    --query "id" -o tsv 2>$null

  if ($testId) {
    Write-Host "Deleting legacy webtest: $name"
    az resource delete --ids $testId
    $foundAny = $true
  }
}

foreach ($name in $alertsToDelete) {
  $alertId = az resource show `
    --resource-group $ResourceGroupName `
    --resource-type "Microsoft.Insights/metricAlerts" `
    --name $name `
    --query "id" -o tsv 2>$null

  if ($alertId) {
    Write-Host "Deleting legacy alert: $name"
    az resource delete --ids $alertId
    $foundAny = $true
  }
}

if (-not $foundAny) {
  Write-Host "No legacy web tests or alerts found for cleanup."
}

exit 0
