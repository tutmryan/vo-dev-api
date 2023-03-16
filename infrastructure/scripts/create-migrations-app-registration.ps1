[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $Name
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$constants = @{
  appRolesFile = Join-Path -Path $PSScriptRoot -ChildPath 'migrations-app-roles.json'
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

$servicePrincipalObjectId = az ad sp list --display-name $Name --query "[].id" --output tsv

#
# Set properties
#
Write-Output 'Setting app roles...'

az ad app update `
  --id $appRegistrationClientId `
  --app-roles ('@{0}' -f $constants.appRolesFile) `
  --output none

Write-Output 'Set app roles'

#
# Require assignment
#
Write-Output 'Enabling required assignment...'

az ad sp update `
  --id $servicePrincipalObjectId `
  --set appRoleAssignmentRequired=true `
  --output none

Write-Output 'Enabled required assignment'

$appRolesFileContent = Get-Content -Path $constants.appRolesFile -Raw
$appRoles = ConvertFrom-Json -InputObject $appRolesFileContent -NoEnumerate
$appRoleId = $appRoles |
  Where-Object 'value' -eq 'MigrationsApp.Access' |
  Select-Object -ExpandProperty 'id'

Write-Output ''
Write-Output ('App registration client ID : {0}' -f $appRegistrationClientId)
Write-Output ('App role ID:                 {0}' -f $appRoleId)
