# Infrastructure

The software platform defined in this project uses Azure PaaS components including:

- Azure SQL Database
- Azure App Service (Premium v3)
- Azure KeyVault
- Azure Blob Storage
- Azure Cache for Redis

## Shared infrastructure

The platform uses shared infrastructure components:

- Azure SQL Server with an Elastic Pool
- Azure App Service Plan

Shared infrastructure is defined in the file shared.bicep and is deployed to a single resource group.

## Instance infrastructure

The platform deploys multiple instances.

Each instance has the following components:

- Azure App Service app which uses the shared App Service plan
- Azure SQL Database which uses the shared Elastic pool
- Azure Cache for Redis
- Azure Blob Storage (one private encrypted storage account and one public storage account with a container for public files)
- Azure KeyVault

Instance components are deployed to a single instance resource group except the database which must live in the shared resource group along with the Elastic Pool.

Instance infrastructure is defined in the file instance.bicep.

## Instance network access

Each instance is an API which is accessed via the App Service App public endpoint.

Outbound network access from the instance API is made to:

- The instance Azure components (described above)
- External HTTPS endpoints for services such as email and SMS

## Deployments

Both shared infrastructure and instance infrastructure / deployments are executed via GitHub workflows.

GitHub workflows are run after authenticating to Azure as using a specific deployment service principal which has access to run deployments, create sql server databases and logins, initialise secrets in kv, initialise VC authority etc.

## Network infrastructure

The platform uses a virtual network with subnets for:

- App Service
- Private Endpoints
- GitHub Actions

Access to services is via private endpoints with service connections and DNS zones.

### GitHub Actions

GitHub Actions runners are hosted in the GitHub Actions subnet.
A Network Security Group (NSG) is used to control traffic in the GitHub Actions subnet as per [GitHub instructions](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/configuring-private-networking-for-github-hosted-runners-in-your-enterprise).
