[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $ResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]
  $FunctionAppName,

  [Parameter(Mandatory = $true)]
  [string]
  $FunctionName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$functionKey = az functionapp function keys list `
  --resource-group $ResourceGroupName `
  --name $FunctionAppName `
  --function-name $FunctionName `
  --query "default" `
  --output tsv

$functionUrl = 'https://{0}.azurewebsites.net/api/{1}' -f $FunctionAppName, $FunctionName

$responseStatusCode = $null
$response = Invoke-RestMethod `
  -Method Post `
  -Uri $functionUrl `
  -Headers @{ 'x-functions-key' = $functionKey } `
  -SkipHttpErrorCheck `
  -StatusCodeVariable 'responseStatusCode'

if ($responseStatusCode -eq 200) {
  Write-Output '✅ Migrations were run successfully'

  $numberOfMigrations = ($response.migrations | Measure-Object).Count
  Write-Output ('Number of migrations run: {0}' -f $numberOfMigrations)

  if ($numberOfMigrations -ne 0) {
    Write-Output ''
    Write-Output 'Migrations:'
    foreach ($migration in $response.migrations) {
      Write-Output ('- {0}' -f $migration.name)
    }
  }
} else {
  Write-Output ('❌ Error while running migrations (HTTP response status code {0})' -f $responseStatusCode)
  Write-Output ('HTTP response body: {0}' -f ($response | ConvertTo-Json -Depth 10 -Compress))
  exit 1
}
