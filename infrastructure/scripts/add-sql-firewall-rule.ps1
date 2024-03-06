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
  $FirewallRuleName,

  [Parameter()]
  [string]
  $IpAddress = (Invoke-RestMethod -Uri 'https://ipinfo.io/json' | Select-Object -ExpandProperty ip)
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

Write-Host "Adding firewall rule '$FirewallRuleName' to SQL server '$SqlServerName' for '$IpAddress'"

# Check required Az.Sql is installed
if (Get-InstalledModule -Name 'Az.Sql' -ErrorAction SilentlyContinue) {
  # Module installed
}
else {
  Set-PSRepository -Name "PSGallery" -SourceLocation 'https://www.powershellgallery.com/api/v2' -InstallationPolicy Trusted
  Install-Module Az.Sql
}

if (Get-AzSqlServerFirewallRule -FirewallRuleName $FirewallRuleName -ResourceGroupName $ResourceGroupName -ServerName $SqlServerName -ErrorAction SilentlyContinue) {
  Set-AzSqlServerFirewallRule -FirewallRuleName $FirewallRuleName -ResourceGroupName $ResourceGroupName -ServerName $SqlServerName `
    -StartIpAddress $IpAddress -EndIpAddress $IpAddress | Out-Null
} else {
  New-AzSqlServerFirewallRule -FirewallRuleName $FirewallRuleName -ResourceGroupName $ResourceGroupName -ServerName $SqlServerName `
    -StartIpAddress $IpAddress -EndIpAddress $IpAddress | Out-Null
}
