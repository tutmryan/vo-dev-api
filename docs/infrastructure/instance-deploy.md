# Steps to deploy a new instance

## Configure environment

Create a new environment in the GitHub repository at <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>
The name of the environment should be the short instance moniker e.g. `demo`.

### Variables

- APP_SERVICE_PLAN_ID
- SQL_SERVER_NAME
- HOME_TENANT_NAME
- HOME_TENANT_ID
- HOME_TENANT_GRAPH_CLIENT_ID (optional)

### Secrets

- API-COOKIE-SECRET: `node: crypto.randomUUID().replace(/-/g, '')`
- LIMITED_ACCESS_SECRET: `node: crypto.randomUUID().replace(/-/g, '')`
- HOME_TENANT_GRAPH_CLIENT_SECRET (optional)

## Add to the deployment matrix

Add the new environment to the deployment matrix in `.github/workflows/release.yml`.

## Tear down an instance

1. Delete the instance resource group e.g. vo-{name}-instance
1. Delete the instance database from the shared infrastructure resource group named vo-{name}-sql-db
1. Remove the auth redirects from the app registration
1. Delete CNAMEs except authority (did.) CNAME ???

   - TODO describe / handle leaving the authority in place for re-use (since it can't be deleted)

1. If you plan to re-create the instance:
   - you must purge the deleted keyvault - re-creating the same keyvault name will fail
   - you must delete the sql DB external login for the API identity - re-using the login between same named API identity will fail (TODO ?? confirm)
