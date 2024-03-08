# Steps to deploy a new instance

## Configure environment

Create a new environment in the API and Admin GitHub repositories at:

- <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>
- <https://github.com/VerifiedOrchestration/verified-orchestration-admin/settings/environments>

The name of the environment should be the instance name e.g. `demo`.

### Configure Admin environment

The admin environment should have the following variables:

- APP_INSIGHTS_CONNECTION_STRING (obtain from the resource group app insights)
- AZURE_AUTHORITY_URL: `https://login.microsoftonline.com/${home tenant id}`
- VID_AUTHORITY_DOMAIN: `${instance name}.did.verifiedorchestration.com` (or from API instance deploy output)

The rest of the variables and secrets are for the API environment.

### Variables

- APP_SERVICE_PLAN_ID
- SQL_SERVER_NAME
- SQL_ELASTIC_POOL_NAME
- HOME_TENANT_NAME
- HOME_TENANT_ID
- HOME_TENANT_GRAPH_CLIENT_ID (optional)
- HOME_TENANT_AUTHORITY_ID (optional)
- HOME_TENANT_VID_SERVICE_CLIENT_ID (optional)
- VID_AUTHORITY_NAME (optional)
- VID_AUTHORITY_DOMAIN (optional)
- ADDITIONAL_AUTH_TENANT_IDS (optional)

#### Feature flag variables

- AUDIT_LOG_STREAMING_ENABLED (optional feature, use a value of `true` to enable provisioning of the Event Hubs and Stream Analytics job)
- DEV_TOOLS_ENABLED (optional, default to true if not provided)

#### Instance configuration variables

- CORS_ORIGIN (optional JSON string: RegExp[] - an array of CORS origins - additional to the deployed Admin and API origins, e.g. ['^https://([a-z0-9]+[.])+company.com$'])
- IDENTITY_ISSUERS (optional JSON Record<string, string> - a map of identity issuer values and their labels; the home tenant is automatically mapped)
- PLATFORM_CONSUMER_APPS (optional JSON Record<string, string> - a map of app OIDs and their labels)

### Secrets

- API-COOKIE-SECRET: `node: crypto.randomUUID().replace(/-/g, '')`
- LIMITED_ACCESS_SECRET: `node: crypto.randomUUID().replace(/-/g, '')`
- HOME_TENANT_GRAPH_CLIENT_SECRET (optional)
- HOME_TENANT_VID_SERVICE_CLIENT_SECRET (optional)

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

## Notes on the instance Database setup

The instance database is created by the deployment service principal who is a member of `dbmanager` role. After creation of the instance database, the deployment service principal creates two SQL users in the instance database and grant them necessary permmissions for API and migration scripts. After that, the deployment service princpal transfers the ownership to a disabled SQL login called `DisabledLogin` as recommend by [this article](https://learn.microsoft.com/en-us/sql/t-sql/statements/alter-authorization-transact-sql?view=sql-server-ver16#best-practice). Once that is done, the deployment service principal will no longer be able to connect to the instance database. If the deployment service principal needs to connect to the instance database in the future, the deployment service principal will need to be added to the Azure SQL administrators group to grant it the server admin permissions.

When setting up an instance database for the first time, the release pipeline:

- creates an instance database in the elastic pool using t-sql as the deployment service principal so that it becomes `db_owner` of the newly created database
- creates an app registration (e.g. "Verified Orchestration Migration (dev)") in Microsoft Entra specifically for the instance to run migration scripts
- sets up federated credential in the migration app for GitHub OIDC connection
- sets up the migration app service principal as a user in the instance database with `db_datareader`, `db_datawriter`, and `db_ddladmin` role memberships
- sets up the API service principal as a user in the instance database with `db_datareader` and `db_datawriter` role memberships
- replaces `db_owner` of the instance database with `DisabledLogin`
- logs in as the migration app service principal
- runs migration scripts
- logs back in as the deployer service principal
- continues with provisioning other resources

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
