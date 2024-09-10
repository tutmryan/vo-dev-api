using '../shared.bicep'

param resourcePrefix = 'vo-nonprd-platform'
param location = 'australiaeast'
param sqlServerAadAdministratorName = 'Verified Orchestration SQL Administrators (non prod)'
param sqlServerAadAdministratorObjectId = '0239fa85-50e8-461d-921d-9bb2a5f896c7'
param elasticPoolEdition = 'Standard'
param elasticPoolCapacity = 50
param appServicePlanSku = 'P1MV3'
param appServicePlanCapacity = 1
param actionGroupAlertName = 'vo-nonprd-alerts'
param actionGroupAlertShortName = 'VO-Alerts NP'
param sqlServerElasticPoolAlertName = 'VO SQL Elastic Pool (non-prod) Alert'
param appServicePlanAlertName = 'VO App Service Plan 1 (non-prod) Alert'
param actionGroupAlertEmail = '' // Will be set by organisation setting
