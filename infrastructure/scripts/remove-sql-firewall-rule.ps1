
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
  $FirewallRuleName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

Write-Host "Removing firewall rule '$FirewallRuleName' from SQL server '$SqlServerName'"

Remove-AzSqlServerFirewallRule -FirewallRuleName $FirewallRuleName -ResourceGroupName $ResourceGroupName -ServerName $SqlServerName -Confirm:$false -Force | Out-Null
