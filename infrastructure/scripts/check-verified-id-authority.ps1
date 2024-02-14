[CmdletBinding()]
param(
  [Parameter()]
  [string]
  $HomeTenantAuthorityId,

  [Parameter()]
  [ValidatePattern('^https://')]
  [string]
  $LinkedDomainUrl
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  didResourceId = '6a8b4b39-c021-437c-b060-5a14a3fd65f3'
}

$authorityExists = $false
$linkedDomainsVerified = $false

if ('' -ne $HomeTenantAuthorityId) {
  $authorityExists = $true
  $linkedDomainsVerified = $true

} else {

  #
  # Check if the Verified ID service is already enabled
  #

  $authorities = az rest `
    --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
    --resource $constants.didResourceId `
    --query 'value' | ConvertFrom-Json

  $authority = $authorities | Where-Object -FilterScript { $_.didModel.linkedDomainUrls -eq $LinkedDomainUrl }[0]

  if ($null -ne $authority) {
    $authorityExists = $true
    $linkedDomainsVerified = $authority.linkedDomainsVerified
  }
}

Write-Output "authorityExists=$($authorityExists)" >> $Env:GITHUB_OUTPUT
Write-Output "linkedDomainsVerified=$($linkedDomainsVerified)" >> $Env:GITHUB_OUTPUT

return @{
  authorityExists       = $authorityExists
  linkedDomainsVerified = $linkedDomainsVerified
}
