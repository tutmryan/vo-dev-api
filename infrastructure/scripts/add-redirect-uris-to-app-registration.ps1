[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]$AppRegistrationId,

  [Parameter()]
  [string[]]$WebRedirectUris = @(),

  [Parameter()]
  [string[]]$SpaRedirectUris = @()
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

if (-not $WebRedirectUris -and -not $SpaRedirectUris) {
  Write-Output "Error: no redirect URIs provided for app registration $AppRegistrationId ❌"
  return
}

$appRegistrationGraphUrl = "https://graph.microsoft.com/v1.0/applications(appId='$AppRegistrationId')"

function Get-RedirectUriUpdateUnion {
  param (
    [ValidateSet('web', 'spa')]
    [string]$Platform,
    [string[]]$RedirectsToAdd
  )

  $existing = (az rest --method get --url $appRegistrationGraphUrl --query "$Platform.redirectUris" | ConvertFrom-Json -noEnumerate) ?? @()
  $union = @($existing + $RedirectsToAdd | Select-Object -uniq)

  if ($union.length -ne $existing.length) {
    $toAdd = $union | Where-Object { $existing -notcontains $_ }
    return @{
      Union = $union
      ToAdd = $toAdd
    }
  }
  return $null
}

$webRedirectUrisToSet
$spaRedirectUrisToSet

if ($WebRedirectUris) {
  $webRedirectUrisToSet = Get-RedirectUriUpdateUnion -Platform 'web' -RedirectsToAdd $WebRedirectUris
}

if ($SpaRedirectUris) {
  $spaRedirectUrisToSet = Get-RedirectUriUpdateUnion -Platform 'spa' -RedirectsToAdd $SpaRedirectUris
}

if (($null -ne $webRedirectUrisToSet) -or ($null -ne $spaRedirectUrisToSet)) {
  $patchBody = @{}
  if ($webRedirectUrisToSet) {
    Write-Output "Adding new web redirect URIs: $($webRedirectUrisToSet.ToAdd -join ',')"
    $patchBody.web = @{ redirectUris = $webRedirectUrisToSet.Union }
  }
  if ($spaRedirectUrisToSet) {
    Write-Output "Adding new spa redirect URIs: $($spaRedirectUrisToSet.ToAdd -join ',')"
    $patchBody.spa = @{ redirectUris = $spaRedirectUrisToSet.Union }
  }

  az rest --method patch --url $appRegistrationGraphUrl --body ($patchBody | ConvertTo-Json)
  Write-Output "Added new redirect URIs for app registration $AppRegistrationId ✅"
} else {
  Write-Output "No new redirect URIs to add for app registration $AppRegistrationId ✅"
}
