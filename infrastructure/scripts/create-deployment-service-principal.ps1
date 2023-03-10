[CmdletBinding(DefaultParameterSetName = 'Environment')]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $Name,

  [Parameter(Mandatory = $true)]
  [string]
  $GitHubOrganisationName,

  [Parameter(Mandatory = $true)]
  [string]
  $GitHubRepositoryName,

  [Parameter(Mandatory = $true, ParameterSetName = 'Environment')]
  [string]
  $GitHubEnvironmentName,

  [Parameter(Mandatory = $true, ParameterSetName = 'Branch')]
  [string]
  $BranchName
)

Set-StrictMode -Version Latest

$constants = @{
  federatedCredentialIssuer = 'https://token.actions.githubusercontent.com'
}

#
# App registration
#
$appRegistration = az ad app list --display-name $Name --output tsv
if ($null -ne $appRegistration) {
  Write-Output ('Found an existing app registration named ''{0}''' -f $Name)
} else {
  Write-Output ('Creating a new app registration named ''{0}''...' -f $Name)

  az ad app create --display-name $Name --output none

  Write-Output ('Created a new app registration named ''{0}''' -f $Name)
}

$appRegistrationAppId = az ad app list --query ("[?displayName=='{0}'].appId" -f $Name) --output tsv

#
# Service principal
#
$servicePrincipal = az ad sp list --display-name $Name --output tsv
if ($null -ne $servicePrincipal) {
  Write-Output ('Found an existing service principal named ''{0}''' -f $Name)
} else {
  Write-Output ('Creating a new service principal named ''{0}''...' -f $Name)

  az ad sp create --id $appRegistrationAppId --output none

  Write-Output ('Created a new service principal named ''{0}''' -f $Name)
}

$servicePrincipalObjectId = az ad sp list --display-name $Name --query "[].id" --output tsv

#
# Federated credential
#
$federatedCredentialSubject = switch ($PSCmdlet.ParameterSetName) {
  'Environment' {
    'repo:{0}/{1}:environment:{2}' -f $GitHubOrganisationName, $GitHubRepositoryName, $GitHubEnvironmentName
  }
  'Branch' {
    'repo:{0}/{1}:ref:refs/heads/{2}' -f $GitHubOrganisationName, $GitHubRepositoryName, $BranchName
  }
}

$federatedCredentialName = switch ($PSCmdlet.ParameterSetName) {
  'Environment' {
    'DeployTo{0}Environment' -f $GitHubEnvironmentName
  }
  'Branch' {
    'DeployFrom{0}Branch' -f ((Get-Culture).TextInfo.ToTitleCase($BranchName))
  }
}

$federatedCredential = az ad app federated-credential list `
  --id $appRegistrationAppId `
  --query ("[?issuer=='{0}' && subject=='{1}']" -f $constants.federatedCredentialIssuer, $federatedCredentialSubject) `
  --output tsv

if ($null -ne $federatedCredential) {
  Write-Output ('Found an existing federated credential to deploy from GitHub Actions from repository ''{0}/{1}'' to environment ''{2}''' -f $GitHubOrganisationName, $GitHubRepositoryName, $GitHubEnvironmentName)
} else {
  Write-Output ('Creating a new federated credential to deploy from GitHub Actions...' -f $Name)

  $newFederatedCredentialPayload = @{
    audiences = @(
      'api://AzureADTokenExchange'
    )
    issuer    = $constants.federatedCredentialIssuer
    name      = $federatedCredentialName
    subject   = $federatedCredentialSubject
  }

  $newFederatedCredentialPayloadJson = ($newFederatedCredentialPayload | ConvertTo-Json -Depth 10 -Compress) -replace '"', '\"'

  az ad app federated-credential create `
    --id $appRegistrationAppId `
    --parameters $newFederatedCredentialPayloadJson `
    --output none

  Write-Output ('Created a new federated credential to deploy from GitHub Actions' -f $Name)
}

$tenantId = az account show --query 'tenantId' --output tsv
Write-Output ''
Write-Output 'Add the following secrets to GitHub Actions'
Write-Output ('- AZURE_CLIENT_ID:                   {0}' -f $appRegistrationAppId)
Write-Output ('- AZURE_SERVICE_PRINCIPAL_OBJECT_ID: {0}' -f $servicePrincipalObjectId)
Write-Output ('- AZURE_TENANT_ID:                   {0}' -f $tenantId)
Write-Output ('- AZURE_SUBSCRIPTION_ID:             <target-subscription-id>')

Write-Output ''
Write-Output ('Assign the necessary roles (for example Contributor) to the ''{0}'' service principal on the desired target resource (either a subscription or a resource group)' -f $Name)
