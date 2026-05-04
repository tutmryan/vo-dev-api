[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

# Execute the verification script with test parameters
& ./verify-dns-records.ps1 -DnsRecords managed.dev.did.verifiedorchestration.com, _dnsauth.managed.dev.did.verifiedorchestration.com, managed.dev.api.verifiedorchestration.com -TimeoutMinutes 1 -PollingIntervalSeconds 5
