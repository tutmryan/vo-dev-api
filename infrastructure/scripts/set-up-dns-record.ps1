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
  $RecordName,

  [Parameter(Mandatory = $true)]
  [string]
  $RecordValue
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  rootDomain = "verifiedorchestration.com"
  dnsApiRoot = "https://api.godaddy.com"
}


Write-Output 'Invoking PUT record with DNS provider for custom domain...'

$headers = @{
  'Authorization' = ("sso-key {0}:{1}" -f $DnsApiKey, $DnsApiSecret)
}

$name = $RecordName -replace (".{0}" -f $constants.rootDomain)
$uri = "{0}/v1/domains/{1}/records/{2}/{3}" -f $constants.dnsApiRoot, $constants.rootDomain, $RecordType, $name
$body = @{
  "data" = $RecordValue
  "ttl"  = 3600
}

Invoke-WebRequest -Uri $uri -Method PUT -Headers $headers -Body ($body | ConvertTo-Json -AsArray) -ContentType "application/json"

Write-Output 'Invoked PUT record with DNS provider for custom domain...'
