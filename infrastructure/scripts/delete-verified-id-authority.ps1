[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://')]
  [string]
  $LinkedDomainUrl
)

. (Join-Path $PSScriptRoot 'shared-utils.ps1')

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  didResourceId = '6a8b4b39-c021-437c-b060-5a14a3fd65f3'
}

$authorities = Invoke-WithRetry -ScriptBlock {
  az rest `
    --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
    --resource $constants.didResourceId `
    --query 'value' | ConvertFrom-Json
}

$authority = $authorities | Where-Object -FilterScript { $_.didModel.linkedDomainUrls -eq $LinkedDomainUrl }[0]

if ($null -ne $authority) {
  Write-Output ('Deleting Verified ID Authority for linked domain URL: {0}' -f $LinkedDomainUrl)
  Write-Output ('Authority ID is: {0}' -f $authority.id)
  Write-Output ('Authority Name is: {0}' -f $authority.name)

  Invoke-WithRetry -ScriptBlock {
    az rest `
      --method delete `
      --url "https://verifiedid.did.msidentity.com/beta/verifiableCredentials/authorities/$($authority.id)" `
      --resource $constants.didResourceId
  }

  Write-Output ('Deleted Authority ID: {0} ✅' -f $authority.id)
} else {
  Write-Output 'Verified ID Authority with linked domain URL: {0} does not exist ❌' -f $LinkedDomainUrl
}
