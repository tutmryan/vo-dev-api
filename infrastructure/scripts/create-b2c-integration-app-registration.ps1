[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

  [Parameter()]
  [switch]
  $SkipAdminConsent
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  voOnboardingDemoTenantId = '10b631d3-9e47-49e1-a938-cbd933f0488d'
}

$tenantId = az account show --query 'tenantId' --output tsv
if ($tenantId -ne $constants.voOnboardingDemoTenantId) {
  Write-Output 'You don''t seem to be logged in to the voonboardingdemo B2C tenant'
  Write-Output 'Please run the command below to log into it'
  Write-Output ('az login --tenant {0} --allow-no-subscriptions' -f $constants.voOnboardingDemoTenantId)
  exit 0
}

#
# Create API app registration if it doesn't exist
#
$appRegistration = az ad app list --display-name $Name --output tsv
if ($appRegistration) {
  Write-Output ('API app registration ''{0}'' already exists' -f $Name)
} else {
  Write-Output ('Creating API app registration ''{0}''...' -f $Name)

  az ad app create `
    --display-name $Name `
    --sign-in-audience AzureADMyOrg `
    --output none

  Write-Output ('Created API app registration ''{0}''' -f $Name)
}

$appRegistrationClientId = az ad app list --query ("[?displayName=='{0}'].appId" -f $Name) --output tsv

#
# Service principal
#
$servicePrincipal = az ad sp list --display-name $Name --output tsv
if ($null -ne $servicePrincipal) {
  Write-Output ('Found an existing service principal named ''{0}''' -f $Name)
} else {
  Write-Output ('Creating a new service principal named ''{0}''...' -f $Name)

  az ad sp create --id $appRegistrationClientId --output none

  Write-Output ('Created a new service principal named ''{0}''' -f $Name)
}

#
# Set properties
#
Write-Output 'Setting API permissions...'

$apiPermissionsPayload = @(
  @{
    # User.ReadWrite.All on Microsoft Graph
    resourceAppId  = '00000003-0000-0000-c000-000000000000'
    resourceAccess = @(
      @{
        id   = '741f803b-c850-494e-b5df-cde7c675a1ca'
        type = 'Role'
      }
    )
  }
)

az ad app update `
  --id $appRegistrationClientId `
  --required-resource-accesses ((ConvertTo-Json -InputObject $apiPermissionsPayload -Compress -Depth 10) -replace '"', '\"') `
  --output none

Write-Output 'Set API permissions'

if (-not $SkipAdminConsent) {
  Write-Output 'Granting admin consent...'

  az ad app permission admin-consent `
    --id $appRegistrationClientId `
    --output none

  Write-Output 'Granted admin consent'
}

Write-Output ('Link to app registration in Azure Portal: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/{0}/isMSAApp~/false' -f $appRegistrationClientId)
