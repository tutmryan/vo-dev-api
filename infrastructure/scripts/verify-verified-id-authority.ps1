[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $TenantId,

  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://')]
  [string]
  $LinkedDomainUrl,

  [Parameter(Mandatory = $true)]
  [string]
  $StorageAccountName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  didResourceId            = '6a8b4b39-c021-437c-b060-5a14a3fd65f3'

  didContainerName         = '$web'
  didBlobName              = '.well-known/did.json'
  didConfigurationBlobName = '.well-known/did-configuration.json'
  contentTypeJson          = 'application/json'
}

#
# Check if the Verified ID service is already enabled
#
$authorityId = $null
$linkedDomainsVerified = $false

$authorities = az rest `
  --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
  --resource $constants.didResourceId `
  --query 'value' | ConvertFrom-Json

$authority = $authorities | Where-Object -FilterScript { $_.didModel.linkedDomainUrls -eq $LinkedDomainUrl }[0]

if ($null -ne $authority) {
  $authorityId = $authority.id
  $linkedDomainsVerified = $authority.linkedDomainsVerified

  if ($true -ne $linkedDomainsVerified) {

    # a user access token is requried to call the following endpoints
    # the user would need to have
    #   - at least the authentication policy administrator Entra role assigned,
    #   - enough permissions to upload DID files to the storage account, and
    #   - Get, List, Create, Delete, Sign key permissions in the keyvault used by the Verified ID service
    # the issue is documented [here](https://drive.google.com/file/d/1FDK2dLGKu8Uc_J3FxvIOYTXGmrMmQpUF/view?usp=drive_link)
    #
    # - create authority; POST /v1.0/verifiableCredentials/authorities
    # - generate DID document; POST /v1.0/verifiableCredentials/authorities/:authorityId/generateDidDocument
    # - generate well known DID configuration; POST /v1.0/verifiableCredentials/authorities/:authorityId/generateWellknownDidConfiguration
    # - validate well known DID configuratino; POST /v1.0/verifiableCredentials/authorities/:authorityId/validateWellKnownDidConfiguration
    az login --tenant $TenantId --use-device-code

    Write-Output 'Generating Verified ID Authority DID Document...'

    $didJson = New-TemporaryFile

    az rest `
      --method post `
      --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/$authorityId/generateDidDocument `
      --resource $constants.didResourceId > $didJson

    Write-Output 'Generated Verified ID Authority DID Document...'

    Write-Output 'Generating Verified ID Authority DID Configuration Document...'

    $didConfigurationJson = New-TemporaryFile
    az rest `
      --method post `
      --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/$authorityId/generateWellknownDidConfiguration `
      --resource $constants.didResourceId > $didConfigurationJson

    Write-Output 'Generated Verified ID Authority DID Configuration Document...'


    Write-Output 'Uploading Verified ID Authority DID Documents...'

    $storageAccountKeys = az storage account keys list `
      --resource-group $ResourceGroupName `
      --account-name $StorageAccountName | ConvertFrom-Json

    az storage blob upload `
      --account-key $storageAccountKeys[0].value `
      --file $didJson `
      --container-name $($constants.didContainerName) `
      --name $($constants.didBlobName) `
      --account-name $StorageAccountName `
      --content-type $($constants.contentTypeJson) `
      --overwrite `
      --output none

    az storage blob upload `
      --account-key $storageAccountKeys[0].value `
      --file $didConfigurationJson `
      --container-name $($constants.didContainerName) `
      --name $($constants.didConfigurationBlobName) `
      --account-name $StorageAccountName `
      --content-type $($constants.contentTypeJson) `
      --overwrite `
      --output none

    Write-Output 'Uploaded Verified ID Authority DID Documents...'

    Write-Output 'Verifying Verified ID Authority DID...'

    $verificationStatus = az rest `
      --method post `
      --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/$authorityId/validateWellKnownDidConfiguration `
      --resource $constants.didResourceId

    $linkedDomainsVerified = $verificationStatus.validationSuccessful
    Write-Output 'Verified Verified ID Authority DID...'

    # log out the user session to prevent the CI/CD actions following this script from being executed in the user's context
    az logout
  }
}

Write-Output "authorityId=$($authorityId)" >> $Env:GITHUB_OUTPUT
Write-Output "linkedDomainsVerified=$($linkedDomainsVerified)" >> $Env:GITHUB_OUTPUT

return @{
  authorityId           = $authorityId
  linkedDomainsVerified = $linkedDomainsVerified
}

