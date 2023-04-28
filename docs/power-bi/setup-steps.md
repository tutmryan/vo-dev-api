# Power BI reporting data access setup

## Support database access via direct query

1. Create a new Azure AD group named `Verified Orchestration Report Data Viewers` + add initial Power BI users to this group
1. Grant group members access to the database role via the following:

```sql
CREATE USER [Verified Orchestration Report Data Viewers] FROM EXTERNAL PROVIDER
GO

ALTER ROLE [report_data_viewer] ADD MEMBER [Verified Orchestration Report Data Viewers]
GO
```

to roll this back, run:

```sql
ALTER ROLE [report_data_viewer] DROP MEMBER [Verified Orchestration Report Data Viewers]
GO

DROP USER [Verified Orchestration Report Data Viewers]
GO

```
