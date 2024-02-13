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

## Log in with an user account during the initial deployment to setup Verified ID authority

A user access token is requried to call the following Verified ID admin API endpoints. The pipeline would pause with a message like this `To sign in, use a web browser to open the page <login_url> and enter the code <device_code> to authenticate.` until the user logs in.

- create authority; POST /v1.0/verifiableCredentials/authorities
- generate DID document; POST /v1.0/verifiableCredentials/authorities/:authorityId/generateDidDocument
- generate well known DID configuration; POST /v1.0/verifiableCredentials/authorities/:authorityId/generateWellknownDidConfiguration
- validate well known DID configuration; POST /v1.0/verifiableCredentials/authorities/:authorityId/validateWellKnownDidConfiguration

The user would need to have

- at least the authentication policy administrator Entra role assigned,
- enough permissions to upload DID files to the storage account, and
- Get, List, Create, Delete, Sign key permissions in the keyvault used by the Verified ID service

The issue is documented [here](https://drive.google.com/file/d/1FDK2dLGKu8Uc_J3FxvIOYTXGmrMmQpUF/view?usp=drive_link).

Once the DID configuration is verified for the authority, the subsequent deployments would not prompt for the user login.

## Tear down an instance

1. Deprecate all contracts which would revoke all issuances as the Verified ID authority cannot be deleted
1. Delete the instance resource group e.g. vo-{name}-instance
1. Delete the instance database from the shared infrastructure resource group named vo-{name}-sql-db
1. Remove the auth redirects from the app registration
1. Delete CNAMEs and TXTs including authority (did.) CNAME and TXT
1. If you plan to re-create the instance:
   - you must purge the deleted keyvault - re-creating the same keyvault name will fail
   - you must delete the sql DB external login for the API identity - re-using the login between same named API identity will fail (TODO ?? confirm)
   - you must invoke Verified ID admin API endpoint to verify well known DID configuration which should invalidate previously verified linked domain. The CI/CD pipeline would detect the unverified status and start the process to get the authority verified.
