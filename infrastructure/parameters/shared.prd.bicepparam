using '../shared.bicep'

param resourcePrefix = 'vo-platform'
param location = 'australiaeast'
param sqlServerAadAdministratorName = 'Verified Orchestration SQL Administrators'
param sqlServerAadAdministratorObjectId = '0dfe2007-e4cd-4066-95b0-970dd465a8ce'
param elasticPoolEdition = 'Standard'
param elasticPoolCapacity = 50
param appServicePlanSku = 'P1MV3'
param appServicePlanCapacity = 2
param appServiceZoneRedundant = true
param gitHubEnterpriseDatabaseId = '139081'
param actionGroupAlertName = 'vo-alerts'
param actionGroupAlertShortName = 'VO-Alerts'
param sqlServerElasticPoolAlertName = 'VO SQL Elastic Pool Alert'
param appServicePlanAlertName = 'VO App Service Plan 1 Alert'
param actionGroupAlertEmail = '' // Will be set by organisation setting
