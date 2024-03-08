# Instance dashboard setup

The following steps are performed against each instance app insights resource.

To begin, navigate to the instance app insights resource in the Azure portal.

## SQL database health

- Click "Application Dashboard" on the top toolbar
- Click "Create" to create a new dashboard
- Select "SQL database health" from the list of templates
- For "Dashboard name", enter `${instance name} SQL database health`
- Select the subscription and instance database resource
- Click "Create" to create the dashboard
- On the dashboard, click "Share" to make it a shared dashboard

## Add custom tiles to the automatically created dashboard

### Add API App Service tiles

- Go to the API App Service resource
- Click on the Monitoring tab
- Pin the Server requests tile to the shared dashboard

### Add Redis Cache tiles

- Go to the Redis Cache resource
- Click into the Memory Usage chart and pin it to the shared dashboard
- Repeat for the Server Load chart

### Add custom queries

- Go to the Logs section in the app insights resource
- For each of the `.kql` query files in the `docs/dashboard` directory:
  - Open the file and copy the query into a new query in the Logs section
  - Click "Run" to execute the query
  - For the _top_ queries, select Chart output
  - Click "Pin to dashboard" to add the query to the default shared dashboard
- Once all the queries are added, navigate to the dashboard and set the names and positions of the tiles
- Save the dashboard
