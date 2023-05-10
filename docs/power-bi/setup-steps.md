# Power BI reporting data access setup

## Support database access via direct query

1. Create a new Azure AD group named `Verified Orchestration Report Data Viewers` + add initial Power BI users to this group
2. Grant group members access to the database role via the following:
3. Give `Verified Orchestration Report Data Viewers` Access on the power BI Workspace

```sql
CREATE USER [Verified Orchestration Report Data Viewers] FROM EXTERNAL PROVIDER
GO

-- run the migration to create role report_data_viewer before running the next

ALTER ROLE [report_data_viewer] ADD MEMBER [Verified Orchestration Report Data Viewers]
GO

ALTER ROLE [report_data_viewer] ADD MEMBER [<aad-user>]
GO
```

to roll this back, run:

```sql
ALTER ROLE [report_data_viewer] DROP MEMBER [<aad-user>]
GO

ALTER ROLE [report_data_viewer] DROP MEMBER [Verified Orchestration Report Data Viewers]
GO

DROP USER [Verified Orchestration Report Data Viewers]
GO

```
