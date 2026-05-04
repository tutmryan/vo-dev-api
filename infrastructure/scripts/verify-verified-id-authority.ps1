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

. (Join-Path $PSScriptRoot 'shared-utils.ps1')

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  didResourceId            = '6a8b4b39-c021-437c-b060-5a14a3fd65f3'

  didContainerName          = '$web'
  didBlobName1              = '.well-known/did.json'
  didConfigurationBlobName1 = '.well-known/did-configuration.json'
  didBlobName2              = 'well-known/did.json'
  didConfigurationBlobName2 = 'well-known/did-configuration.json'
  contentTypeJson           = 'application/json'
}

#
# Check if the Verified ID service is already enabled
#
$authorityId = $null
$linkedDomainsVerified = $false

$authorities = Invoke-WithRetry -ScriptBlock {
  az rest `
    --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities `
    --resource $constants.didResourceId `
    --query 'value' | ConvertFrom-Json
}

$authority = $authorities | Where-Object -FilterScript { $_.didModel.linkedDomainUrls -eq $LinkedDomainUrl }[0]

if ($null -ne $authority) {
  $authorityId = $authority.id
  $linkedDomainsVerified = $authority.linkedDomainsVerified

  if ($true -ne $linkedDomainsVerified) {

    Write-Output 'Generating Verified ID Authority DID Document...'

    $didJson = New-TemporaryFile

    Invoke-WithRetry -ScriptBlock {
      az rest `
        --method post `
        --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/$authorityId/generateDidDocument `
        --resource $constants.didResourceId > $didJson
    }

    Write-Output 'Generated Verified ID Authority DID Document...'

    Write-Output 'Generating Verified ID Authority DID Configuration Document...'

    $didConfigurationJson = New-TemporaryFile
    Invoke-WithRetry -ScriptBlock {
      az rest `
        --method post `
        --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/$authorityId/generateWellknownDidConfiguration `
        --resource $constants.didResourceId > $didConfigurationJson
    }

    Write-Output 'Generated Verified ID Authority DID Configuration Document...'


    Write-Output 'Uploading Verified ID Authority DID Documents...'

    $storageAccountKeys = Invoke-WithRetry -ScriptBlock {
      az storage account keys list `
        --resource-group $ResourceGroupName `
        --account-name $StorageAccountName | ConvertFrom-Json
    }

    # There have been issues with Microsoft sometimes trying to validate at /well-known instead of the correct /.well-known
    # uploading blobs to both endpoints for now is an easy and harmless hack that gets around this.
    Invoke-WithRetry -ScriptBlock {
      az storage blob upload `
        --account-key $storageAccountKeys[0].value `
        --file $didJson `
        --container-name $($constants.didContainerName) `
        --name $($constants.didBlobName1) `
        --account-name $StorageAccountName `
        --content-type $($constants.contentTypeJson) `
        --overwrite `
        --output none
    }

    Invoke-WithRetry -ScriptBlock {
      az storage blob upload `
        --account-key $storageAccountKeys[0].value `
        --file $didConfigurationJson `
        --container-name $($constants.didContainerName) `
        --name $($constants.didConfigurationBlobName1) `
        --account-name $StorageAccountName `
        --content-type $($constants.contentTypeJson) `
        --overwrite `
        --output none
    }

    Invoke-WithRetry -ScriptBlock {
      az storage blob upload `
        --account-key $storageAccountKeys[0].value `
        --file $didJson `
        --container-name $($constants.didContainerName) `
        --name $($constants.didBlobName2) `
        --account-name $StorageAccountName `
        --content-type $($constants.contentTypeJson) `
        --overwrite `
        --output none
    }

    Invoke-WithRetry -ScriptBlock {
      az storage blob upload `
        --account-key $storageAccountKeys[0].value `
        --file $didConfigurationJson `
        --container-name $($constants.didContainerName) `
        --name $($constants.didConfigurationBlobName2) `
        --account-name $StorageAccountName `
        --content-type $($constants.contentTypeJson) `
        --overwrite `
        --output none
    }

    Write-Output 'Uploaded Verified ID Authority DID Documents...'

    Write-Output 'Verifying Verified ID Authority DID...'
    # Dont use exponential backoff as we want to be able to return quickly once it succeeds, allow 20 mins for front door propagation
    $verificationStatus = Invoke-WithRetry -RetryBaseSeconds 30 -MaxRetries 40 -ExponentialBackoff $false -ScriptBlock {
      az rest `
        --method post `
        --url https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/$authorityId/validateWellKnownDidConfiguration `
        --resource $constants.didResourceId
    }

    $linkedDomainsVerified = $verificationStatus.validationSuccessful
    Write-Output 'Verified Verified ID Authority DID...'

  }
}

Write-Output "authorityId=$($authorityId)" >> $Env:GITHUB_OUTPUT
Write-Output "linkedDomainsVerified=$($linkedDomainsVerified)" >> $Env:GITHUB_OUTPUT

return @{
  authorityId           = $authorityId
  linkedDomainsVerified = $linkedDomainsVerified
}
