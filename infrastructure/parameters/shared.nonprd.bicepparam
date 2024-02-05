using '../shared.bicep'

param environment = 'nonprd'
param location = 'australiaeast'
param sqlServerAadAdministratorName = 'Verified Orchestration SQL Administrators (non prod)'
param sqlServerAadAdministratorObjectId = '0239fa85-50e8-461d-921d-9bb2a5f896c7'
param elasticPoolEdition = 'Basic'
param elasticPoolCapacity = 50
param appServicePlanSku = 'P1V3'
param appServicePlanCapacity = 1

