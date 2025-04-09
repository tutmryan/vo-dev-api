[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string[]]$DnsRecords,

  [Parameter(Mandatory = $false)]
  [int]$TimeoutMinutes = 5,

  [Parameter(Mandatory = $false)]
  [int]$PollingIntervalSeconds = 10
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

# Check required DnsClient-PS is installed
if (Get-InstalledModule -Name 'DnsClient-PS' -ErrorAction SilentlyContinue) {
  # Module installed
} else {
  Set-PSRepository -Name "PSGallery" -SourceLocation 'https://www.powershellgallery.com/api/v2' -InstallationPolicy Trusted
  Install-Module DnsClient-PS
}

function Test-DnsRecord {
  param (
    [Parameter(Mandatory = $true)]
    [string]$Record
  )

  $result = Resolve-Dns $Record -UseTcpOnly
  return -not $result.HasError
}

$startTime = Get-Date
$timeout = (Get-Date).AddMinutes($TimeoutMinutes)
$pendingRecords = $DnsRecords.Clone()
$verifiedRecords = @()

Write-Output "Starting DNS verification for $($DnsRecords.Count) records..."

while ($pendingRecords.Count -gt 0 -and (Get-Date) -lt $timeout) {
  $stillPending = @()

  foreach ($record in $pendingRecords) {
    if (Test-DnsRecord -Record $record) {
      Write-Output "Verified DNS record: $record"
      $verifiedRecords += $record
    } else {
      $stillPending += $record
    }
  }

  $pendingRecords = $stillPending

  if ($pendingRecords.Count -gt 0) {
    Write-Output "Waiting for $($pendingRecords.Count) DNS records to propagate..."
    Start-Sleep -Seconds $PollingIntervalSeconds
  }
}

$elapsedTime = (Get-Date) - $startTime

if ($pendingRecords.Count -gt 0) {
  $pendingList = $pendingRecords | ForEach-Object { "- $_" } | Join-String -Separator "`n"
  $errorMessage = "DNS verification failed after $($elapsedTime.TotalMinutes) minutes. The following records are still pending:`n$pendingList"
  Write-Error $errorMessage
  exit 1
}

Write-Output "All DNS records verified successfully in $($elapsedTime.TotalMinutes) minutes!"
exit 0
