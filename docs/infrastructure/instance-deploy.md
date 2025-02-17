# Steps to deploy a new instance

## Check capacity before deploying a new instance

Check the capacity of the shared infrastructure resources before deploying a new instance.

- Is the SQL elastic pool at capacity?
- Is the App Service Plan at capacity?

## Configure environment

Create a new environment in the API GitHub repositories at:

- <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>

The name of the environment should be the instance name e.g. `demo` or `sandbox.demo`.

## Configure API environment

The environment should have deployment protection rules applied (required reviewers bobblat cuzzlor).

### Variables

- APP_SERVICE_PLAN_ID
- SQL_SERVER_NAME
- SQL_ELASTIC_POOL_NAME
- HOME_TENANT_NAME
- HOME_TENANT_ID
- HOME_TENANT_GRAPH_CLIENT_ID (optional, only required for MS Graph integration)
- HOME_TENANT_AUTHORITY_ID (optional, only required for customer hosted authorities)
- HOME_TENANT_VID_SERVICE_CLIENT_ID (optional, only required for customer hosted authorities)
- VID_AUTHORITY_NAME (optional, only required for VO hosted authorities)
- VID_AUTHORITY_DOMAIN (optional, only required for VO hosted authorities)
- ADDITIONAL_AUTH_TENANT_IDS (optional)
- GRAPHQL_MAX_ALIASES (optional, only required on customer request)
- GRAPHQL_MAX_DEPTH (optional, only required on customer request)
- GRAPHQL_MAX_DIRECTIVES (optional, only required on customer request)
- GRAPHQL_MAX_TOKENS (optional, only required on customer request)

#### Use of VID_AUTHORITY_NAME:

- For VO hosted authorities, `VID_AUTHORITY_NAME` must be set to a title-case version of the instance name e.g. `Customer Sandbox` or `Customer`
- For customer hosted authorities, `VID_AUTHORITY_NAME` must not be set

#### Use of VID_AUTHORITY_DOMAIN:

- For VO hosted authorities, `VID_AUTHORITY_DOMAIN` must be set to `<instance>.did.verifiedorchestration.com`
- For VO hosted authorities with custom DNS, `VID_AUTHORITY_DOMAIN` must be set to the customer’s supplied custom DID domain. After provisioning, supply the 2 DNS entries to the customer before re-running the pipeline to verify the authority once the DNS entries are complete.
- For customer hosted authorities, `VID_AUTHORITY_DOMAIN` must not be set

#### Feature flag variables

Note: for production instances, make sure you set `DEV_TOOLS_ENABLED` to false (unless explicitly requested by the customer, then also set `DEMO_ENABLED` to false in production instances).

- AUDIT_LOG_STREAMING_ENABLED (optional feature, use a value of `true` to enable provisioning of the Event Hubs and Stream Analytics job)
- DEV_TOOLS_ENABLED (optional, use `false` to disable developer tools e.g. in production instances, defaults to `true` if not provided)
- DEMO_ENABLED (optional, apply a value to control demo features, defaults to `DEV_TOOLS_ENABLED` if not provided)
- FACE_CHECK_ENABLED (optional, use `false` to disable Face Check feature e.g issuing credentials with face check photo, creating presentation request with face check; defaults to `true` if not provided)

#### Instance configuration variables

- CORS_ORIGIN (optional JSON string: RegExp[] - an array of CORS origins - additional to the deployed Admin and API origins, e.g. ['^https://([a-z0-9]+[.])+company\\.com$']) (**Note**: ensure the `.` is escaped so it will be matched as a literal value in the regular expression.)
- IDENTITY_ISSUERS (optional JSON Record<string, string> - a map of identity issuer values and their labels; the home tenant is automatically mapped)
- PLATFORM_CONSUMER_APPS (optional JSON Record<string, string> - a map of app OIDs and their labels)

### Secrets

- HOME_TENANT_GRAPH_CLIENT_SECRET (optional, only required for MS Graph integration)
- HOME_TENANT_VID_SERVICE_CLIENT_SECRET (optional, only required for customer hosted authorities)

## Add to the deployment matrix

Add the new environment to the deployment matrix in `.github/workflows/release.yml`.

- Make sure you choose the production deployment matrix for customer instances.
- The 3 matrix entries are:
  - `instance`: the instance name (must match environment name exactly, this is the domain prefix)
  - `resourceGroup`: the azure resource group name, follow the pattern, use hyphens e.g. `vo-{instance}-instance`
  - `resourcePrefix`: the prefix for azure resource names, follow the pattern, use hyphens e.g. `vo-{instance}`
- Create a branch and PR for the changes to the deployment matrix.
- Once the PR is merged, the new environment will be available for deployment.

## Manual steps to be performed after the first deployment run

The app registration created for the instance would need a logo and the publisher verification so that it is presented as a verified app from "Verified Orchestration Pty Ltd" when the customer installs it into their tenant and grants admin consent.

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "App registrations".
1. Find the app registration for the instance, (i.e. "Verified Orchestration (<instance name>)"), then click on it.
1. In the "Manage" section, click on "Branding & properties".
1. Upload the [Verified Orchestration logo](https://github.com/VerifiedOrchestration/verified-orchestration-admin/blob/main/public/icons/favicon-310x310.png) as a new logo. Click "Save".
1. In the "Publisher verification" section, click on "Add MPN ID to verify publisher".
1. Provide the partner ID of Verified Orchestration Pty Ltd, "6659076", as MPN ID, then click on "Verify and save". (_Note:_ this step needs to be performed by a global administrator of the Entra tenant).

## Deploy the admin site and portal site for the instance

1. Refer to the "Setting up a new instance" section in [Admin Readme.md](https://github.com/VerifiedOrchestration/verified-orchestration-admin/blob/main/README.md#setting-up-a-new-instance)
1. Refer to the "Setting up a new instance" section in [Portal Readme.md](https://github.com/VerifiedOrchestration/verified-orchestration-portal/blob/main/README.md#setting-up-a-new-instance)

## Handling failed deployments

Before commencing any destructive remediation work:

- **Do not delete the resource group** of the failed deployment (the KV has purge protection, there is no known situation this will help)
- Any **click-ops must be performed as a pair** using screen sharing for peer review
- **If you are not confident in the outcome, do not proceed**, seek help from a peer and take the time required to gain confidence in any proposed remediation

### Failure between creation of instance app registration and persistence of secrets

A failed initial deployment may result in creation of the instance app registration + secrets and failure to persist those secrets in the Key vault.

Attempting redeployment in this state will continue to fail with 2x the following error message, vaguely indicating that the two expected secrets are missing:
`The specified resource does not exist`

This error will appear twice in the deployment error details shown in the deployment task output in the resource group in Azure.

#### Recommended recovery

Either:

- Delete the app registration
- Delete the secrets from the app registration

### Transient DNS timing issues

Setup of resources with custom DNS entries generally requires more than one DNS entry to be created and queryable before resource deployment can be successfully made.

For this reason, most deployment tasks attempt to create the pre-requisite DNS entries early, allowing maximum time between creation of the entry and the resource which depends on it.

However, fairly frequently, one will fail with a message such as:
`CNAME Record is invalid.  Please ensure the CNAME record has been created.`

#### Recommended recovery

Re-running the deployment a second time usually results in a successful deployment.

## Steps to tear down an instance

Note: click-ops must be performed as a pair using screen sharing for peer review, do not perform tear-down operations alone.

### Optional prep (if the customer wants)
1. Deprecate all contracts which would revoke all issuances as the Verified ID authority cannot be deleted

### Main steps
1. PR to remove matrix entries (3x)
1. Delete the instance resource group e.g. vo-{name}-instance
1. Delete the instance database from the shared infrastructure resource group named vo-{name}-sql-db
1. Delete GitHub environments (3x)
1. Delete all the instance app registrations:
   - `Verified Orchestration (<instance>)`
  
### DNS cleanup
1. Delete CNAMEs and TXTs including authority (did.) CNAME and TXT

### Notes
1. If you plan to re-create the instance:
   - you must purge the deleted keyvault - re-creating the same keyvault name will fail
   - you must delete the sql DB external login for the API identity - re-using the login between same named API identity will fail (TODO ?? confirm)
   - you must invoke Verified ID admin API endpoint to verify well known DID configuration which should invalidate previously verified linked domain. The CI/CD pipeline would detect the unverified status and start the process to get the authority verified.

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
