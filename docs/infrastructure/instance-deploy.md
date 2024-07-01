# Steps to deploy a new instance

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

#### Feature flag variables

- AUDIT_LOG_STREAMING_ENABLED (optional feature, use a value of `true` to enable provisioning of the Event Hubs and Stream Analytics job)
- DEV_TOOLS_ENABLED (optional, use `false` to disable developer tools e.g. in production instances, defaults to `true` if not provided)

#### Instance configuration variables

- CORS_ORIGIN (optional JSON string: RegExp[] - an array of CORS origins - additional to the deployed Admin and API origins, e.g. ['^https://([a-z0-9]+[.])+company\\.com$']) (**Note**: ensure the `.` is escaped so it will be matched as a literal value in the regular expression.)
- IDENTITY_ISSUERS (optional JSON Record<string, string> - a map of identity issuer values and their labels; the home tenant is automatically mapped)
- PLATFORM_CONSUMER_APPS (optional JSON Record<string, string> - a map of app OIDs and their labels)

### Secrets

- API_COOKIE_SECRET: `node: crypto.randomUUID().replace(/-/g, '')`
- LIMITED_ACCESS_SECRET: `node: crypto.randomUUID().replace(/-/g, '')`
- LIMITED_APPROVAL_SECRET: `node: crypto.randomUUID().replace(/-/g, '')`
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

## Configure the application instance Dashboad in Application Insights

<del>Follow the [dashboard setup instructions](../dashboard/setup.md).</del>

_The manual setup of the application instance Dashboard is no longer required._

The automated deployment pipeline provisions a workbook with charts using metrics from App Insights, Azure Cache for Redis, and custom queries for each instance.

Follow [the guide](../dashboard/workbook.md) to customise and update the workbook in the deployment pipeline, so changes are applied to all instances.

## Troubleshooting

- `Deploy SQL DB instance` step in `Instance SQL database job` failed

  > "message":"The Resource 'Microsoft.Sql/servers/vo-platform-sql-server-1/databases/vo-\<instance\>-sql-db' under resource group 'vo-platform-shared-infra' was not found.

  This step could throw a transient error above as it can take sometime for the sql database created in the step preceeding it to become available in some cases.

  It can be resolved by running the pipeline again.

## Revert temporary permissions for authority verification

If you wish to revert temporary permissions granted to interactive users for authority verification, you can follow these steps:

- Delete the access policy from the by the Verified ID service keyvault for the interative user.

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
1. Delete all the instance app registrations:
   - `Verified Orchestration (<instance>)`
   - `Verified Orchestration Migration (<instance>)`
