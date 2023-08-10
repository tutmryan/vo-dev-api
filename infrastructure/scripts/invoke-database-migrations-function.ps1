[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]
  $FunctionAppName,

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

#
# Run migrations
#
$runMigrationsFunctionUrl = 'https://{0}.azurewebsites.net/api/RunDatabaseMigrations' -f $FunctionAppName
$runMigrationsResponseStatusCode = $null

foreach ($index in @(1..$numberOfAttempts)) {
  $runMigrationsResponse = Invoke-RestMethod `
    -Method Post `
    -Uri $runMigrationsFunctionUrl `
    -Headers @{ Authorization = ('Bearer {0}' -f $token) } `
    -SkipHttpErrorCheck `
    -StatusCodeVariable 'runMigrationsResponseStatusCode'

  if ($runMigrationsResponseStatusCode -eq 200) {
    Write-Output '✅ Migrations were run successfully'

    $numberOfMigrations = ($runMigrationsResponse.migrations | Measure-Object).Count
    Write-Output ('Number of migrations run: {0}' -f $numberOfMigrations)

    if ($numberOfMigrations -ne 0) {
      Write-Output ''
      Write-Output 'Migrations:'
      foreach ($migration in $runMigrationsResponse.migrations) {
        Write-Output ('- {0}' -f $migration.name)
      }
    }

    break
  } else {
    Write-Output ('❌ [{0}/{1}] Error while running migrations (HTTP response status code {2})' -f $index, $numberOfAttempts, $runMigrationsResponseStatusCode)
    Write-Output ('HTTP response body: {0}' -f ($runMigrationsResponse | ConvertTo-Json -Depth 10 -Compress))
    Write-Output ''

    Start-Sleep -Seconds $waitInSecondsBetweenAttempts
  }
}

if ($runMigrationsResponseStatusCode -ne 200) {
  Write-Output ('❌ Unable to run migrations after {0} attempts' -f $numberOfAttempts)
  exit 1
}
