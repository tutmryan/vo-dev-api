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

. (Join-Path $PSScriptRoot 'shared-utils.ps1')

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  didResourceId = '6a8b4b39-c021-437c-b060-5a14a3fd65f3'
  rootDomain    = 'verifiedorchestration.com'
}

$authorityId = $null
$authorityExists = $false
$linkedDomainsVerified = $false
$isVoSubdomain = $LinkedDomainUrl -match ('.' + $constants.rootDomain)

if ('' -ne $HomeTenantAuthorityId) {
  $authorityId = $HomeTenantAuthorityId
  $authorityExists = $true
  $linkedDomainsVerified = $true

} else {

  #
  # Check if the Verified ID service is already enabled
  #

  $authorities = Invoke-WithRetry -ScriptBlock {
    az rest `
      --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
      --resource $constants.didResourceId `
      --query 'value' | ConvertFrom-Json
  }

  $authority = $authorities | Where-Object -FilterScript { $_.didModel.linkedDomainUrls -eq $LinkedDomainUrl }[0]

  if ($null -ne $authority) {
    $authorityId = $authority.id
    $authorityExists = $true
    $linkedDomainsVerified = $authority.linkedDomainsVerified
  }
}

Write-Output "authorityId=$($authorityId)" >> $Env:GITHUB_OUTPUT
Write-Output "authorityExists=$($authorityExists)" >> $Env:GITHUB_OUTPUT
Write-Output "linkedDomainsVerified=$($linkedDomainsVerified)" >> $Env:GITHUB_OUTPUT
Write-Output "isVoSubdomain=$($isVoSubdomain)" >> $Env:GITHUB_OUTPUT

return @{
  authorityId           = $authorityId
  authorityExists       = $authorityExists
  linkedDomainsVerified = $linkedDomainsVerified
  isVoSubdomain         = $isVoSubdomain
}
