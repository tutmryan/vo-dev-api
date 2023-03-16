[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $FunctionAppName,

  [Parameter(Mandatory = $true)]
  [string]
  $FunctionName,

  [Parameter(Mandatory = $true)]
  [string]
  $MigrationsAppClientId
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$token = az account get-access-token `
  --scope ('{0}/.default' -f $MigrationsAppClientId) `
  --query "accessToken" `
  --output tsv

$functionUrl = 'https://{0}.azurewebsites.net/api/{1}' -f $FunctionAppName, $FunctionName
$responseStatusCode = $null

$numberOfAttempts = 10
$waitInSecondsBetweenAttempts = 5
foreach ($index in @(1..$numberOfAttempts)) {
  $response = Invoke-RestMethod `
    -Method Post `
    -Uri $functionUrl `
    -Headers @{ Authorization = ('Bearer {0}' -f $token) } `
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

    break
  } else {
    Write-Output ('❌ [{0}/{1}] Error while running migrations (HTTP response status code {2})' -f $index, $numberOfAttempts, $responseStatusCode)
    Write-Output ('HTTP response body: {0}' -f ($response | ConvertTo-Json -Depth 10 -Compress))
    Write-Output ''

    Start-Sleep -Seconds $waitInSecondsBetweenAttempts
  }
}

if ($responseStatusCode -ne 200) {
  Write-Output ('❌ Unable to run migrations after {0} attempts' -f $numberOfAttempts)
  exit 1
}
