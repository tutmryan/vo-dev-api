# Steps for provisioning of shared infrastructure

These steps will be performed once per hosting tenant, before running the automated shared infrastructure pipeline against that hosting tenant.

## Create an app registration for the migrations application

```powershell
./infrastructure/scripts/create-migrations-app-registration.ps1 -Name 'Verified Orchestration DB Migrations[ (non prod)]'
```

This script will output the client ID of the app registration and the ID of the role, which we need in the next step.

### Non-prod output

```
App registration client ID : c61b153c-b34e-4dfc-9368-198a3edc4dce
App role ID:                 d7d87a02-23ac-4af4-b87d-2bb70b52bea3
```

## Create a deployment service principal

We need a service principal so that GitHub Actions can:

- Provision infrastructure and deploy our applications on Azure.
- Execute the migrations on our database.

We automated the creation and configuration of this service principal in the [`create-deployment-service-principal.ps1` script](../../infrastructure/scripts/create-deployment-service-principal.ps1).
We need to be logged in to the Azure CLI to the correct tenant with appropriate permissions before running it.

```powershell
./infrastructure/scripts/create-deployment-service-principal.ps1 \
  -Name 'Verified Orchestration Deployment[ (non prod)]' \
  -GitHubOrganisationName 'VerifiedOrchestration' \
  -GitHubRepositoryName 'verified-orchestration-api' \
  -GitHubEnvironmentName '<Non Production | Production>' \
  -MigrationsAppClientId '<client ID from prior step>' \
  -MigrationsAppRoleId '<role ID from prior step>'
```

### Non-prod output

```
- AZURE_CLIENT_ID:                   33bc2302-a407-4504-8b3a-e92add06cfc4
- AZURE_SERVICE_PRINCIPAL_OBJECT_ID: 0c8ae26a-f0ad-418f-a0f6-7082b7b02f87
- AZURE_TENANT_ID:                   5c14bb50-7602-4c0d-b785-5dee865e4665
- AZURE_SUBSCRIPTION_ID:             05c17245-e1b2-4870-96ff-0711f5eaa466
```

## Configure organisation variables in GitHub

Add organisation variables to GitHub using the output from the previous step.

Prefix the variable names with the hosting tenant name, e.g. `[NON_]PROD_AZURE_CLIENT_ID`.

| Name                                | Value                                  |
| ----------------------------------- | -------------------------------------- |
| `AZURE_CLIENT_ID`                   | The client ID of the app registration  |
| `AZURE_SERVICE_PRINCIPAL_OBJECT_ID` | The object ID of the service principal |
| `AZURE_TENANT_ID`                   | The ID of the target tenant            |
| `AZURE_SUBSCRIPTION_ID`             | The ID of the target subscription      |

To do so:

1. Navigate to the Organistation variables page at <https://github.com/organizations/VerifiedOrchestration/settings/variables/actions>.
1. Click Create new organisation variable.
1. Add the variables, ensuring you prefix them for the hosting tenant (`NON_PROD_` or `PROD_`).

## Create a resource group to hold shared Azure resources

1. Navigate to the Azure Portal subscriptions blade: <https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade>.
1. Select the relevant subscription.
1. In the "Settings" section in the left menu, click on "Resource groups".
1. Click on "+ Create"
1. Enter the name: `vo-[nonprd/prd]-platform-shared-infra`, select the appropriate region, and finalise the creation.

## Give the deployment service principal permissions to deploy shared Azure resources

1. Navigate to the previously created resource group.
1. Click on "Access control (IAM)".
1. Click on "+ Add" > "Add role assignment".
1. Pick the "Contributor" role, then click on "Next".
1. Click on "+ Select members", then find the deployment service principal by its name.
1. Click on "Review + assign", then finalise the role assignment.

## Create an Azure AD group for Azure SQL administrators

1. Navigate to the Azure Active Directory blade in the Azure Portal: <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>.
1. In the "Manage" section, click on "Groups", then on "New group".
1. Enter a group name: 'Verified Orchestration SQL Admins ([non ]prod)', description: 'Administrators of the Verified Orchestration platform SQL infrastructure' select relevant members, and finalise the group creation.
1. Refresh the page until the new group appears, and note down its object ID.

### Non-prod object ID

```
 0239fa85-50e8-461d-921d-9bb2a5f896c7
```

## Configure the shared infrastructure bicep parameters

Using the output from these steps, create a `shared.<nonprd/prd>.bicepparam` file in the `infrastructure/parameters` directory.

If you have access, e.g. for non-prod, you can check the shared infrastructure deployment by running a what-if command, e.g.:

```
az deployment group what-if --resource-group vo-nonprd-platform-shared-infra --template-file ./infrastructure/shared.bicep --parameters ./infrastructure/parameters/shared.nonprd.bicepparam
```

## Create and run the shared infrastructure pipeline

You can now create a new workflow in the `.github/workflows` directory to call the `shared-infra` action for the hosting tenant.
