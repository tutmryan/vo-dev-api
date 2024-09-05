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

$actionGroup = Get-AzActionGroup -SubscriptionId $SubscriptionId -ResourceGroupName $SharedResourceGroupName -Name $ActionGroupName

if ($null -ne $actionGroup) {
    Write-Output "Action Group Exists: $($actionGroup.Name)"
    Write-Output "actionGroupName=$($actionGroup.Name)" >> $Env:GITHUB_OUTPUT
} else {
    Write-Output "Action Group $($actionGroup.Name) does not exist."
}
