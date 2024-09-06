[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $ActionGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $SharedResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $SubscriptionId
)

try {
  $actionGroup = Get-AzActionGroup -SubscriptionId $SubscriptionId -ResourceGroupName $SharedResourceGroupName -Name $ActionGroupName -ErrorAction Stop
  if ($null -ne $actionGroup) {
    Write-Output "Action group '$($actionGroup.Name)' was found in the resource group '$($SharedResourceGroupName)'."
    Write-Output "actionGroupName=$($actionGroup.Name)" >> $Env:GITHUB_OUTPUT
  }
}
catch {
  $errorMessage = $_.Exception.Message
  Write-Output "$($errorMessage)"
  Write-Output "Please create the action group '$($ActionGroupName)' manually and refer to the 'shared-infra-setup.md' documentation for detailed instructions."
}
