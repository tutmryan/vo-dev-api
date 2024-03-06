
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
  $RuleName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

Write-Host "Removing firewall rule '$RuleName' from SQL server '$SqlServerName'"

Remove-AzSqlServerFirewallRule -FirewallRuleName $RuleName -ResourceGroupName $ResourceGroupName -ServerName $SqlServerName -Confirm:$false -Force | Out-Null
