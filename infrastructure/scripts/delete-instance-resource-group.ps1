[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName
)

. (Join-Path $PSScriptRoot 'shared-utils.ps1')

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

Write-Output "Starting deletion of resource group: $ResourceGroupName"

# Step 1: Find and delete all resource locks
Write-Output "Finding resource locks in resource group..."

$locks = Invoke-WithRetry -ScriptBlock {
  az lock list --resource-group $ResourceGroupName --query "[].{name:name, id:id, level:level}" -o json | ConvertFrom-Json
}

if ($locks -and $locks.Count -gt 0) {
  Write-Output "Found $($locks.Count) resource lock(s) in resource group '$ResourceGroupName'"

  foreach ($lock in $locks) {
    Write-Output "Deleting resource lock: $($lock.name) (Level: $($lock.level))"
    Invoke-WithRetry -ScriptBlock {
      az lock delete --ids $lock.id
    }
    Write-Output "Successfully deleted lock: $($lock.name)"
  }
} else {
  Write-Output "No resource locks found in resource group '$ResourceGroupName'"
}

# Pause briefly to ensure locks are fully deleted before proceeding
Start-Sleep -Seconds 10

# Step 2: Delete the resource group
Write-Output "Deleting resource group: $ResourceGroupName"

# Check if resource group exists before attempting deletion
$resourceGroupExists = Invoke-WithRetry -ScriptBlock {
  az group exists --name $ResourceGroupName
}

if ($resourceGroupExists -eq 'true') {
  Write-Output "Resource group '$ResourceGroupName' exists. Proceeding with deletion..."

  Invoke-WithRetry -ScriptBlock {
    az group delete `
      --name $ResourceGroupName `
      --yes `
      --no-wait
  }

  Write-Output "Resource group deletion initiated for: $ResourceGroupName"
  Write-Output "Note: Resource group deletion is running in the background and may take several minutes to complete."
} else {
  Write-Output "Resource group '$ResourceGroupName' does not exist. Nothing to delete."
}

exit 0
