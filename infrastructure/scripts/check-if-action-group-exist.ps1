[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $ActionGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $SharedResourceGroupName
)

try {
  $actionGroupJson = az monitor action-group show --resource-group $SharedResourceGroupName --name $ActionGroupName
  $actionGroup = $actionGroupJson | ConvertFrom-Json
  if ($null -ne $actionGroup) {
    Write-Output "Action group '$($actionGroup.name)' was found in the resource group '$($SharedResourceGroupName)'."
    Write-Output "actionGroupName=$($actionGroup.name)" >> $Env:GITHUB_OUTPUT
  }
  else {
    throw "Action group $($ActionGroupName) not found."
  }
}
catch {
  $errorMessage = $_.Exception.Message
  Write-Output "$($errorMessage)"
}
