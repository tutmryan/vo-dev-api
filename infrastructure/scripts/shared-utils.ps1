$requestConstants = @{
  maxRetries = 4
  waitBeforeSeconds = 0
  retryBaseSeconds = 5
}

# Usage: What ever the scriptblock runs last will be returned as the result, best for wrapping single API calls
# $result = Invoke-WithRetry -ScriptBlock {
#   az rest --method post --url $someUrl --resource $someResource | ConvertFrom-Json
# }
function Invoke-WithRetry {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)] [scriptblock] $ScriptBlock,
    [int] $MaxRetries = $requestConstants.maxRetries,
    [int] $WaitBeforeSeconds = $requestConstants.waitBeforeSeconds,
    [int] $RetryBaseSeconds = $requestConstants.retryBaseSeconds,
    [bool] $ExponentialBackoff = $true
  )
 
  if ($WaitBeforeSeconds -gt 0) {
    Start-Sleep -Seconds $WaitBeforeSeconds
  }

  for ($attempt = 0; $attempt -le $MaxRetries; $attempt++) {
    try {
      return & $ScriptBlock
    } catch {
      if ($attempt -eq $MaxRetries) { throw }
      [int]$delay = $null
      if ($ExponentialBackoff) {
        $delay = $RetryBaseSeconds * [math]::Pow(2, $attempt)
      } else {
        $delay = $RetryBaseSeconds
      }
      Write-Warning "Attempt $($attempt + 1) failed. Retrying in ${delay}s..."
      Start-Sleep -Seconds $delay
    }
  }
}
