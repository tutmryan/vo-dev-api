# Steps for provisioning of shared infrastructure

These steps will be performed once per hosting tenant, before running the automated shared infrastructure pipeline against that hosting tenant.

## Create and configure deployment service principal

We need a service principal so that GitHub Actions can:

- Provision infrastructure and deploy our applications on Azure.
- Execute the migrations on our database & set up the API managed identity external user and roles.

### Create deployment app registration

1. Create a new app registration in the Azure Portal: <https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps>.
1. Enter name: Verified Orchestration Deployment[ (non prod)]
1. Click Register to create
1. Click on "Certificates & secrets", select the "Federated credentials" tab, then "+ Add credential".
1. For "Federated credential scenario", select "GitHub Actions deploying Azure resources".
1. Enter:
   - Subject identifier: `repo:VerifiedOrchestration/verified-orchestration-api`
   - Name: `VerifiedOrchestration-verified-orchestration-api`
1. Add a second federated credential:
1. Enter:
   - Subject identifier: `repo:VerifiedOrchestration/verified-orchestration-admin`
   - Name: `VerifiedOrchestration-verified-orchestration-admin`
   - click "Add"
1. Add a third federated credential:
1. Enter:
   - Subject identifier: `repo:VerifiedOrchestration/verified-orchestration-portal`
   - Name: `VerifiedOrchestration-verified-orchestration-portal`
   - click "Add"

Refer to [documentation here](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure?tabs=azure-portal%2Clinux)

Gather the following details:

- Client ID
- Tenant ID
- Subscription ID

## Configure GitHub repo OIDC subject claims

By default, we need federated credentials for every Org/Repo/Environment combination. This scenario won't work well with us adding new environments for every instance.

We can customise the [GitHub repo subject claim](https://docs.github.com/en/rest/actions/oidc?apiVersion=2022-11-28#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository) to use just the Org/Repo combination.

Using the GitHub CLI, run the following commands to customise the API and Admin website repos, dropping use of the `context` claim key.

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/VerifiedOrchestration/verified-orchestration-api/actions/oidc/customization/sub \
  -F use_default=false \
  -f "include_claim_keys[]=repo"
```

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/VerifiedOrchestration/verified-orchestration-admin/actions/oidc/customization/sub \
  -F use_default=false \
  -f "include_claim_keys[]=repo"
```

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/VerifiedOrchestration/verified-orchestration-portal/actions/oidc/customization/sub \
  -F use_default=false \
  -f "include_claim_keys[]=repo"
```

## Configure organisation variables in GitHub

Add organisation variables and secrets to GitHub using the output from the previous steps and auth setup.

Prefix the variable names with the hosting tenant name, e.g. `[NON_]PROD_AZURE_CLIENT_ID`.

| Name                                   | Value                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `AZURE_CLIENT_ID`                      | The client ID of the deployment app registration                               |
| `AZURE_TENANT_ID`                      | The ID of the target tenant                                                    |
| `AZURE_SUBSCRIPTION_ID`                | The ID of the target subscription                                              |
| `KEY_VAULT_NAME`                       | The name of the key vault to hold signing keys used by Verified ID authorities |
| `KEY_VAULT_RESOURCE_GROUP_NAME`        | The name of the resource group to hold Verified ID resources                   |
| `DNS_API_KEY`                          | The GoDaddy DNS API key                                                        |
| `DNS_API_SECRET`                       | The GoDaddy DNS API secret                                                     |
| `SMS_SECRET`                           | The Twilio SMS secret                                                          |
| `EMAIL_API_KEY`                        | The SendGrid email API key                                                     |
| `LIMITED_ACCESS_CLIENT_SECRET`         | The client secret for the limited access client                                |
| `LIMITED_APPROVAL_CLIENT_SECRET`       | The client secret for the limited approval client                              |
| `LIMITED_PHOTO_CAPTURE_CLIENT_SECRET`  | The client secret for the limited photo capture client                         |
| `LIMITED_ASYNC_ISSUANCE_CLIENT_SECRET` | The client secret for the limited async issuance client                        |
| `VID_CALLBACK_CLIENT_SECRET`           | The client secret for the VID callback client                                  |

To do so:

1. Navigate to the Organistation variables page at <https://github.com/organizations/VerifiedOrchestration/settings/variables/actions>.
1. Click Create new organisation variable.
1. Add the variables, ensuring you prefix them for the hosting tenant (`NON_PROD_` or `PROD_`).

## Give the deployment service principal MS Graph access

The deployment service principal needs to be able to read and write application registrations to add redirect URIs for deployed components.

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "App registrations".
1. Find the deployment app registration by its name, then click on it.
1. Click on "API permissions", then on "+ Add a permission".
1. Select "Microsoft Graph", then "Application permissions".
1. Search for "Application.ReadWrite.All", then click on "Add permissions".
1. Click on "Grant admin consent for [tenant name]", then confirm the consent.

## Give the deployment service principal Authority ReadWrite access

The deployment service principal needs to be able to create and validate authorities.

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "App registrations".
1. Find the deployment app registration by its name, then click on it.
1. Click on "API permissions", then on "+ Add a permission".
1. Select "APIs my organization uses", then "Verifiable Credentials Service Admin".
1. Select "VerifiableCredential.Authority.ReadWrite", then click on "Add permissions".
1. Click on "Grant admin consent for [tenant name]", then confirm the consent.

## Give the deployment service principal Contributor access to the Azure subscription to create resource groups + deploy resources

1. Navigate to the Subscription.
1. Click on "Access control (IAM)".
1. Click on "+ Add" > "Add role assignment".
1. Pick the "Contributor" role, then click on "Next".
1. Click on "+ Select members", then find the deployment service principal by its name.
1. Click on "Review + assign", then finalise the role assignment.

## Give the deployment service principal limited 'Role Based Access Control Administrator' role assignment

This is required for setting up blob storage contributor access for the API managed identity.

1. Navigate to the Subscription.
1. Click on "Access control (IAM)".
1. Click on "+ Add" > "Add role assignment".
1. Pick the "Role Based Access Control Administrator" role, then click on "Next".
1. Click on "+ Select members", then find the deployment service principal by its name.
1. On the Conditions tab, select "Allow user to only assign selected roles to selected principals (fewer privileges)", then click on "Next".
1. Click on "+ Select roles and principals".
1. On "Constrain roles and principal types" click "Configure".
1. Select "Storage Blob Data Contributor" and click "Select".
1. On "Principal types", select "Service principals".
1. Click "Save".

## Create an Azure AD group for Azure SQL administrators

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "Groups", then on "New group".
1. Enter a group name: 'Verified Orchestration SQL Admins ([non ]prod)', description: 'Administrators of the Verified Orchestration platform SQL infrastructure' select relevant members, and finalise the group creation.

### Temporarily add the deployment service principal to the Azure SQL administrators group

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "Groups", then on the group you created in the previous step.
1. Click on "Members", then on "+ Add members".
1. Search for the deployment service principal by its name, then click on "Select".

_NOTE:_ the deployment service principal needs to be removed manually from the Azure SQL administrators group after the shared infra pipeline is run successfully for the first time and has created and set up the SQL server instance(s). Further deployments of the shared infra pipeline or the deployments of instance release pipelines do not need the deployment service principal to be the server admin.

When the shared infra pipeline is first run, after creating the SQL server(s), it

- creates a server login for the deployment service principal
- creates a sql user for the login in the master database
- adds the sql user to dbmanager role which allows the deployment service principal to create the instance databases
- creates a server login called `DisabledLogin` with a random password which is not persisted anywhere
- disable the `DisabledLogin`, and it will be set as `db_owner` for all instance databases

## Configure the shared infrastructure bicep parameters

Using the output from these steps, create a `shared.<nonprd/prd>.bicepparam` file in the `infrastructure/parameters` directory.

If you have access, e.g. for non-prod, you can check the shared infrastructure deployment by running a what-if command, e.g.:

```
az deployment group what-if --resource-group vo-nonprd-platform-shared-infra --template-file ./infrastructure/shared.bicep --parameters ./infrastructure/parameters/shared.nonprd.bicepparam
```

## Create a resource group to hold Verified ID resources

1. Navigate to the Azure Portal subscriptions blade: <https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade>.
1. Select the relevant subscription.
1. In the "Settings" section in the left menu, click on "Resource groups".
1. Click on "+ Create"
1. Pick a name (e.g. `vo-entra-verified-id-core`), select the appropriate region, and finalise the creation.

## Create a key vault to hold signing keys used Verified ID authorities

1. Navigate to the Azure Portal key vaults blade: <https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults>
1. Click on "+ Create"
1. Select the resource group created in the previous step (e.g. `vo-entra-verified-id-core`)
1. Pick a name (e.g. `vo-vid-keys-nonprod` for non prod tenant), select the appropriate region, enable purge protection and click "Next" to configure access
1. Choose `Vault access policy` options in `Permission model` section
1. Click on "Review + create" and finalise the creation
1. Once the key vault is created, browse to it in the portal and delete default access policy created for the current login user

## Create access policies to grant Verified ID services access to the keys in the key vault

1. Navigate to the key vault
1. Click on "Access policies"
1. Click on "+ Create"
1. Select `Get`, `Sign`, `Create` and `List` in "Key permissions" section
1. Click on "Next" to select a principal
1. Select `Verifiable Credentials Service` (bb2a64ee-5d29-4b07-a491-25806dc854d3) and finalise the creation
1. Click on "+ Create" to create another access policy
1. Select `Sign` in "Key permissions" section
1. Click on "Next" to select a principal
1. Select `Verifiable Credentials Service Request` (3db474b9-6a0c-4840-96ac-1fceb342124f) and finalise the creation

## Apply firewall configuration to the key vault

1. Navigate to the key vault
1. Select "Networking" from "Settings" in the left menu
1. Click on "Firewalls and virtual networks"
1. Select "Allow public access from specific virtual networks and IP addresses"
1. Select "Allow trusted Microsoft services to bypass this firewall"
1. Click "Apply"

## Create and run the shared infrastructure pipeline

You can now create a new workflow in the `.github/workflows` directory to call the `shared-infra` action for the hosting tenant.

## Give the SQL Server user assigned identity AAD Directory Readers role assignment

After running the shared infrastructure pipeline, but before deploying any instances, the SQL Server user assigned identity must be assigned the AAD Directory Readers role to support authentication from API managed identities.

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "Roles and administrators".
1. Find the "Directory Readers" role, select it, then click on "Add assignments".
1. Search for the SQL Server user assigned identity by its name e.g. `vo-nonprd-platform-sql-server-identity`, then click on "Add".

## Remove the deployment service principal from the Azure SQL administrators group

The deployment service principal needs to be removed from the Azure SQL administrators group so that it is no longer a server administrator. If it remains a server administrator, the deployment service principal can connect to any instance databases in the server.

## Create alerts for SQL Elastic Pool

1. Navigate to Monitor Alerts
2. Select new alert rule
3. For the Resource, Select the shared infra SQL Elastic Pool resource
4. For conditions, select:
   1. Data space used percent:
      - Operator: Greater than
      - Aggregation type: Average
      - Threshold value: 70
      - Frequency of evaluation: Every 15 minutes Lookback period: 15 minutes
   2. CPU percentage:
      - Operator: Greater than
      - Aggregation type: Average
      - Threshold value: 70
      - Frequency of evaluation: Every 1 minutes Lookback period: 5 minutes
   3. DTU percentage:
      - Operator: Greater than
      - Aggregation type: Average
      - Threshold value: 70
      - Frequency of evaluation: Every 1 minutes Lookback period: 5 minutes
5. Under Action Group, select + Create action group.
   1. Basics:
      - Resource group: vo-[nonprd-]platform-shared-infra
      - Region: Global
      - Action group name: VO-Alerts
      - Display Name: VO Alerts
   2. Notifications:
      - Notification type: Email/SMS message/Push/Voice
      - Enter the email where alerts will be sent
   3. Review and create
6. Under details.
   - Resource group: vo-platform-shared-infra
   - Severity: critical
   - Alert rule name: VO SQL Elastic Pool Alert
   - Severity: critical

## Create alerts for the App Service Plan

1. Navigate to Monitor Alerts
2. Select new alert rule
3. For the Resource, Select the shared infra App Service Plan resource
4. For conditions, select:
   1. CPU percentage:
      - Operator: Greater than
      - Aggregation type: Average
      - Threshold value: 80
      - Frequency of evaluation: Every 1 minutes Lookback period: 5 minutes
   2. Memory percentage:
      - Operator: Greater than
      - Aggregation type: Average
      - Threshold value: 80
      - Frequency of evaluation: Every 1 minutes Lookback period: 5 minutes
   3. HTTP Queue Length percentage:
      - Operator: Greater than
      - Aggregation type: Average
      - Unit: Count
      - Threshold value: 100
      - Frequency of evaluation: Every 1 minutes Lookback period: 5 minutes
5. Under Action Group, select previously created VO Alerts.
6. Under details.
   - Resource group: vo-platform-shared-infra
   - Severity: critical
   - Alert rule name: Verified Orchestration App Service Plan 1 (non prod) Alert
   - Severity: critical
7. Repeat these steps for each App Service Plan.

## Warning about changing shared infrastructure (App Service Plan)

Documentation indicates outbound IPs of the App Service can change when the App Service Plan tier changes or when auto-scaling is enabled.

> Because of autoscaling behaviors, the outbound IP can change at any time when running on a Consumption plan or in a Premium plan.

<https://learn.microsoft.com/en-us/azure/azure-functions/ip-addresses?tabs=portal#outbound-ip-address-changes>

The Redis, SQL, KeyVault firewalls are configured based on the outbound IPs of the App Service at the time of deployment.

You must consider this situation when planning any change to the App Service plan tier or enabling auto-scaling.

You might either re-deploy instances after updating the app service plan or use [Data center outbound IP addresses](https://learn.microsoft.com/en-us/azure/azure-functions/ip-addresses?tabs=portal#data-center-outbound-ip-addresses) for the Redis firewall instead.
