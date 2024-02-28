using '../shared.bicep'

param resourcePrefix = 'vo-platform'
param location = 'australiaeast'
param sqlServerAadAdministratorName = 'Verified Orchestration SQL Administrators'
param sqlServerAadAdministratorObjectId = '0dfe2007-e4cd-4066-95b0-970dd465a8ce'
param elasticPoolEdition = 'Standard'
param elasticPoolCapacity = 50
param appServicePlanSku = 'P1V3'
param appServicePlanCapacity = 1

