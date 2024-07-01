# Updating instance workbook

To begin, navigate to Azure Workbook resource of the instance in the Azure portal.

- Click "Open Workbook"
- Click "Edit" on the toolbar
- Edit the existing components or add new components
- Ensure the resource IDs are not hard coded into the components and use parameters instead (refer to the existing "App insight resource" and "Redis cache resource" parameters)
- Click "Save" on the toolbar once the desired changes have been made
- Click "Advanced Editor" on the toolbar and copy "Gallery Template" in JSON to [workbook.json](../../infrastructure/workbook.json)
- Click "Done Editing" on the toolbar to go back to view mode
- Ensure the parameter placeholders such as `<appInsightsResourceId>`, `<appInsightsResourceName>`, `<redisCacheResourceId>` and `<redisCacheResourceId>` are not overwritten in [workbook.json](../../infrastructure/workbook.json)
- Ensure additional parameter placesholders are added by following the examples in [instance.bicep](../../infrastructure/instance.bicep#L581)
- Create a pull request for the changes and roll them out to instances via the deployment pipeline once the PR is completed.
