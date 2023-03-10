# Manual steps required for infrastructure provisioning

Most of the provisioning is automated, but there are still some steps that need to be performed manually on a per-environment basis.

## 1. Create an environment in the GitHub repository

See <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>.

## 2. Create a deployment service principal

We need a service principal so that GitHub Actions can provision infrastructure and deploy our applications on Azure.

We automated the creation and configuration of this service principal in the [`create-deployment-service-principal.ps1` script](../../infrastructure/scripts/create-api-app-registration.ps1).
You need to be logged in to the Azure CLI to the correct tenant with appropriate permissions before running it.

```powershell
./infrastructure/scripts/create-deployment-service-principal.ps1 `
  --Name '<name-of-service-principal>' `
  --GitHubOrganisationName '<name-of-github-org>' `
  --GitHubRepositoryName '<name-of-github-repository>' `
  --GitHubEnvironmentName '<name-of-gihub-environment>'
```

## 3. Add secrets to the GitHub environment

The previous script will output secrets that you need to add to the GitHub environment created in the first step.

| Secret name                         | Secret value                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AZURE_CLIENT_ID`                   | App ID of the created app registration                                                                                                                                          |
| `AZURE_SERVICE_PRINCIPAL_OBJECT_ID` | Object ID of the created service principal (also called enterprise application)                                                                                                 |
| `AZURE_TENANT_ID`                   | ID of the [Verified Orchestration tenant](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview/query/azure%20ad)                                |
| `AZURE_SUBSCRIPTION_ID`             | ID of the [Microsoft Azure Sponsorship subscription](https://portal.azure.com/#@verifiedorchestration.com/resource/subscriptions/de5e410a-fa03-4be4-bcda-b068b4be7f52/overview) |

To do so:

1. Navigate to the environment for the repository at <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>.
1. Click on the relevant environment.
1. Add the secrets.

## 4. Create a resource group to hold Azure resources

1. Navigate to the Azure Portal subscriptions blade: <https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade>.
1. Select the relevant subscription.
1. In the "Settings" section in the left menu, click on "Resource groups".
1. Click on "+ Create"
1. Pick a name, select the appropriate region, and finalise the creation.

## 5. Give the deployment service principal permissions to deploy Azure resources

1. Navigate to the previously created resource group.
1. Click on "Access control (IAM)".
1. Click on "+ Add" > "Add role assignment".
1. Pick the "Contributor" role, then click on "Next".
1. Click on "+ Select members", then find the deployment service principal by its name.
1. Click on "Review + assign", then finalise the role assignment.

## 6. Create an Azure AD group for Azure SQL administrators

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "Groups", then on "New group".
1. Enter a group name, select relevant members, and finalise the group creation.
1. Refresh the page until the new group appears, and note down its object ID.

## 7. Add the new job in the GitHub Actions workflow

A job for an existing environment probably already exists, so it's a matter of duplicating it.
Make sure that the job for the new environment depends on the job for the previous environment, via the `needs` property.

Adjust the parameters as required:

- Environment name.
- SQL Azure administrators group name and object ID.
- App Service Plan and Azure SQL database SKUs.

## 8. Create SQL users for the applications' managed identities

Once the infrastructure has been provisioned via GitHub Actions, we need to create users in the database for the applications to connect to it.
At the time of writing, we have two applications connecting to the database:

1. The Functions app executing the migrations.
1. The GraphQL API.

To create the users:

1. Make sure you're a member of the Azure AD group for SQL administrators created earlier.
1. Navigate to the Azure SQL instance in the relevant resource group.
1. In the "Security" section of the left menu, click on "Networking".
1. In the "Firewall rules" section, click on "+ Add your client IPv4 address", then "Save".
1. In the "Settings" section of the left menu, click on "SQL databases", then on the relevant database.
1. In the left menu, click on "Query editor", then click on the "Continue as..." button in the "Azure Active Directory" section.
1. Copy the contents of the [`create-aad-user.sql` script](../../infrastructure/scripts/create-aad-user.sql) and replace the `<aad-user>` token with the name of the application.
1. The Functions app needs the `db_ddladmin` role, the GraphQL API doesn't.
