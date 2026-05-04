[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $UserObjectId,

  [Parameter(Mandatory = $true)]
  [string]
  $ServicePrincipalName
)
# Script for assigning all roles on a given enterprise app for quick access to using composer for testing
# is not used in automation
. (Join-Path $PSScriptRoot 'shared-utils.ps1')

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

# Define the roles to assign
$rolesToAssign = @(
  'VerifiableCredential.Reader',
  'VerifiableCredential.Issuer',
  'VerifiableCredential.PartnerAdmin',
  'VerifiableCredential.OidcAdmin',
  'VerifiableCredential.InstanceAdmin',
  'VerifiableCredential.CredentialAdmin',
  'VerifiableCredential.ApprovalRequestAdmin',
  'VerifiableCredential.SupportAgent',
  'credentials.revoke',
  'presentationFlow.read',
  'presentationFlow.cancel',
  'presentationFlow.template.read',
  'presentationFlow.template.delete',
  'presentationFlow.template.update',
  'presentationFlow.template.create',
  'presentationFlow.create',
  'tools.apiExplorer.access'
)

Write-Output "Assigning roles to user '$UserObjectId' on service principal '$ServicePrincipalName'..."

# Get the user object ID
Write-Output "Retrieving user object ID..."
$user = Invoke-WithRetry -ScriptBlock {
  az ad user show --id $UserObjectId | ConvertFrom-Json
}

if (-not $user) {
  throw "User '$UserObjectId' not found"
}

$userId = $user.id
Write-Output "Found user with object ID: $userId"

# Get the service principal
Write-Output "Retrieving service principal..."
$servicePrincipal = Invoke-WithRetry -ScriptBlock {
  az ad sp list --display-name $ServicePrincipalName --query "[0]" | ConvertFrom-Json
}

if (-not $servicePrincipal) {
  throw "Service principal '$ServicePrincipalName' not found"
}

$servicePrincipalId = $servicePrincipal.id
$servicePrincipalAppId = $servicePrincipal.appId
Write-Output "Found service principal with object ID: $servicePrincipalId"

# Get all app roles from the service principal
Write-Output "Retrieving app roles from service principal..."
$appRoles = $servicePrincipal.appRoles

# Iterate through each role and assign it
foreach ($roleValue in $rolesToAssign) {
  Write-Output "Processing role: $roleValue"
  
  # Find the role definition
  $role = $appRoles | Where-Object { $_.value -eq $roleValue } | Select-Object -First 1
  
  if (-not $role) {
    Write-Warning "Role '$roleValue' not found in service principal app roles. Skipping..."
    continue
  }
  
  $roleId = $role.id
  Write-Output "  Found role ID: $roleId"
  
  # Check if the user already has this role assigned
  Write-Output "  Checking for existing assignment..."
  $existingAssignments = Invoke-WithRetry -ScriptBlock {
    az rest `
      --method GET `
      --url "https://graph.microsoft.com/v1.0/servicePrincipals/$servicePrincipalId/appRoleAssignedTo" `
      --query "value[?principalId=='$userId' && appRoleId=='$roleId']" | ConvertFrom-Json
  }
  
  if ($existingAssignments -and $existingAssignments.Count -gt 0) {
    Write-Output "  Role '$roleValue' is already assigned to user. Skipping..."
    continue
  }
  
  # Assign the role
  Write-Output "  Assigning role '$roleValue' to user..."
  
  $assignmentPayload = @{
    principalId = $userId
    resourceId  = $servicePrincipalId
    appRoleId   = $roleId
  } | ConvertTo-Json -Compress
  
  Invoke-WithRetry -ScriptBlock {
    az rest `
      --method POST `
      --headers Content-Type=application/json `
      --url "https://graph.microsoft.com/v1.0/servicePrincipals/$servicePrincipalId/appRoleAssignedTo" `
      --body $assignmentPayload
  }
  
  Write-Output "  Successfully assigned role '$roleValue'"
}

Write-Output ""
Write-Output "Role assignment completed successfully!"
Write-Output "User: $($user.userPrincipalName)"
Write-Output "Service Principal: $ServicePrincipalName"
Write-Output "Roles processed: $($rolesToAssign.Count)"