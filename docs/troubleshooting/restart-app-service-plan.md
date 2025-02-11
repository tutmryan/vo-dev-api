# Restarting an App Service Plan

## Pre-work

1. PIM into the role `Subscription Owner` or `Contributor` for the subscription that contains the App Service Plan you want to restart.
2. Get the subscription ID (azure search subscription)
3. Get the resource group name (normally ending in -shared-infra) where the plan is located.
4. Get the plan name
5. Get the machine name
   1. Go to a web app instance hosted by the plan
   2. Select Monitoring -> Health Check
   3. Select the Instances tab
   4. Find the machine name (server) in the list

## Azure cloud console

Once the pre-work is done, you can restart the App Service Plan using the Azure cloud console.

Choose bash and run the following command, replacing the placeholders with the values you gathered in the pre-work.

Note: this is an example of restarting the app service plan in the non-prod environment.

```bash
SUBSCRIPTION_ID="05c17245-e1b2-4870-96ff-0711f5eaa466"
RESOURCE_GROUP="vo-nonprd-platform-shared-infra"
PLAN_NAME="vo-nonprd-platform-app-service-plan-1"
MACHINE_NAME="LM1SDLWK0000CW"
API_URL="https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Web/serverfarms/${PLAN_NAME}/workers/${MACHINE_NAME}/reboot?api-version=2024-04-01"
az rest --method post --url "${API_URL}"
```
