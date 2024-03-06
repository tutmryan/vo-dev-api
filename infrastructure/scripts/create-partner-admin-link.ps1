[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [Int]$PartnerId
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true


try {
  # Check required Az.ManagementPartner is installed
  if (Get-InstalledModule -Name 'Az.ManagementPartner' -ErrorAction SilentlyContinue) {
    # Module installed
  } else {
    Set-PSRepository -Name "PSGallery" -SourceLocation 'https://www.powershellgallery.com/api/v2' -InstallationPolicy Trusted
    Install-Module Az.ManagementPartner
  }

  # Collect Azure Partner Id
  $existingAzurePALIdInfo = $null
  $existingAzurePALIdInfo = Get-AzManagementPartner -ErrorAction SilentlyContinue

  if ($existingAzurePALIdInfo) {
    Write-Host "Azure Partner Id already set to:" $existingAzurePALIdInfo.PartnerId
    Write-Host "The exisiting Azure Partner name is:" $existingAzurePALIdInfo.PartnerName
  } else {
    Write-Host "Azure PAL not set on this account in this tenancy."
  }

  # Check if Azure Azure Partner Ids are the same. If not, set it.
  if (($null -ne $existingAzurePALIdInfo) -and ($existingAzurePALIdInfo.PartnerId -eq $PartnerId.Tostring())) {
    Write-Host "✅  Azure PAL Id is alredy set to ${$PartnerId}. Exiting..."
    break
  } else {
    Write-Host "The Azure Partner Id you wish to set is different to what is already set. It will be updated"
    New-AzManagementPartner -PartnerId $PartnerId -ErrorAction SilentlyContinue
  }
} catch {
  Write-Exception $_
  throw
}

