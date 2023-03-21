# Manual steps required for infrastructure provisioning

Most of the provisioning is automated, but there are still some steps that need to be performed manually on a per-environment basis.

## Create an environment in the GitHub repository

See <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>.

## Create an app registration for the API

```powershell
./infrastructure/script/create-api-app-registration.ps1 `
  -Name '<name-of-application>' `
  -IdentifierUri '<identifier-uri>'
```

We need to create a client secret for this application:

1. Navigate to the link in the script output.
1. Click on "Certificates & secrets", then "+ New client secret".
1. Give a description, select the appropriate expiry date, then "Add".

We need to add the new client secret to the GitHub secrets:

1. Navigate to the environment for the repository at <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>.
1. Click on the relevant environment.
1. Add the secret as `API_CLIENT_SECRET`.

## Create an app registration for the UI (admin app)

```powershell
./infrastructure/script/create-ui-app-registration.ps1 `
  -Name '<name-of-application>' `
  -RedirectUrl '<redirect-url' `
  -ApiAppRegistrationName '<api-app-registration-name>'
```

We also need to create a client secret for this application:

1. Navigate to the link in the script output.
1. Click on "Certificates & secrets", then "+ New client secret".
1. Give a description, select the appropriate expiry date, then "Add".

We need to add the new client secret to the GitHub secrets:

1. Navigate to the environment for the repository at <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>.
1. Click on the relevant environment.
1. Add the secret as `UI_CLIENT_SECRET`.

## Create an app registration for the migrations application

```powershell
./infrastructure/scripts/create-migrations-app-registration.ps1 -Name '<name-of-application>'
```

This script will output the client ID of the app registration and the ID of the role, which we need in the next step.

## Create a deployment service principal

We need a service principal so that GitHub Actions can:

- Provision infrastructure and deploy our applications on Azure.
- Execute the migrations on our database.

We automated the creation and configuration of this service principal in the [`create-deployment-service-principal.ps1` script](../../infrastructure/scripts/create-api-app-registration.ps1).
We need to be logged in to the Azure CLI to the correct tenant with appropriate permissions before running it.

```powershell
./infrastructure/scripts/create-deployment-service-principal.ps1 `
  -Name '<name-of-service-principal>' `
  -GitHubOrganisationName '<name-of-github-org>' `
  -GitHubRepositoryName '<name-of-github-repository>' `
  -GitHubEnvironmentName '<name-of-gihub-environment>' `
  -MigrationsAppClientId '<client-id-from-previous-step>' `
  -MigrationsAppRoleId '<role-id-from-previous-step>'
```

The previous script will output values that we need to add as environment variables (not secrets) to the GitHub environment.

| Name                                | Value                                  |
| ----------------------------------- | -------------------------------------- |
| `AZURE_CLIENT_ID`                   | The client ID of the app registration  |
| `AZURE_SERVICE_PRINCIPAL_OBJECT_ID` | The object ID of the service principal |
| `AZURE_TENANT_ID`                   | The ID of the target tenant            |
| `AZURE_SUBSCRIPTION_ID`             | The ID of the tearget subscription     |

To do so:

1. Navigate to the environment for the repository at <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>.
1. Click on the relevant environment.
1. Add the environment variables.

## Add secrets to the GitHub environment

The applications need secure configuration settings that we store as secrets in the GitHub environment.

| Secret name         | Secret value    |
| ------------------- | --------------- |
| `API_COOKIE_SECRET` | A random string |

To do so:

1. Navigate to the environment for the repository at <https://github.com/VerifiedOrchestration/verified-orchestration-api/settings/environments>.
1. Click on the relevant environment.
1. Add the secrets.

## Create a resource group to hold Azure resources

1. Navigate to the Azure Portal subscriptions blade: <https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade>.
1. Select the relevant subscription.
1. In the "Settings" section in the left menu, click on "Resource groups".
1. Click on "+ Create"
1. Pick a name, select the appropriate region, and finalise the creation.

## Give the deployment service principal permissions to deploy Azure resources

1. Navigate to the previously created resource group.
1. Click on "Access control (IAM)".
1. Click on "+ Add" > "Add role assignment".
1. Pick the "Contributor" role, then click on "Next".
1. Click on "+ Select members", then find the deployment service principal by its name.
1. Click on "Review + assign", then finalise the role assignment.

## Create an Azure AD group for Azure SQL administrators

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "Groups", then on "New group".
1. Enter a group name, select relevant members, and finalise the group creation.
1. Refresh the page until the new group appears, and note down its object ID.

## Add the new job in the GitHub Actions workflow

A job for an existing environment probably already exists, so it's a matter of duplicating it.
Make sure that the job for the new environment depends on the job for the previous environment, via the `needs` property.

Adjust the parameters as required:

- Environment name.
- SQL Azure administrators group name and object ID.
- App Service Plan and Azure SQL database SKUs.

## Create SQL users for the applications' managed identities

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
