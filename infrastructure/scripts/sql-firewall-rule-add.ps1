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
  $RuleNamePrefix,

  [Parameter()]
  [string]
  $IpAddress
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

if (-not $IpAddress) {
  $IpAddress = (Invoke-RestMethod -Uri 'https://ipinfo.io/json' | Select-Object -ExpandProperty ip)
}

$FirewallRuleName = '{0}_{1}' -f $RuleNamePrefix, $IpAddress.Replace('.', '-')

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

Write-Output "ruleName=$($FirewallRuleName)" >> $Env:GITHUB_OUTPUT

return @{
  ruleName     = $FirewallRuleName
}
