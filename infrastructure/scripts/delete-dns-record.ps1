[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $DnsApiKey,

  [Parameter(Mandatory = $true)]
  [string]
  $DnsApiSecret,

  [Parameter(Mandatory = $true)]
  [ValidateSet('TXT', 'CNAME')]
  [string]
  $RecordType,

  [Parameter(Mandatory = $true)]
  [string]
  $RecordName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  rootDomain = "verifiedorchestration.com"
  dnsApiRoot = "https://api.godaddy.com"
}

$headers = @{
  'Authorization' = ("sso-key {0}:{1}" -f $DnsApiKey, $DnsApiSecret)
}

$name = $RecordName -replace (".{0}" -f $constants.rootDomain)
$uri = "{0}/v1/domains/{1}/records/{2}/{3}" -f $constants.dnsApiRoot, $constants.rootDomain, $RecordType, $name

Write-Output "Checking if DNS record exists at: $uri"
$response = Invoke-WebRequest -Uri $uri -Method GET -Headers $headers

# Parse the response body to check if the record actually exists
$records = $response.Content | ConvertFrom-Json
$matchingRecord = $records | Where-Object { $_.name -eq $name -and $_.type -eq $RecordType }

if ($matchingRecord) {
  Write-Output "DNS record exists, will DELETE record at: $uri"

  Invoke-WebRequest -Uri $uri -Method DELETE -Headers $headers

  Write-Output 'DNS record deleted successfully.'
} else {
  Write-Output 'DNS record does not exist, nothing to delete.'
}
