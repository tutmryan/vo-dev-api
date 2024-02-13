@description('The resource prefix to use for all resources')
@minLength(3)
param resourcePrefix string

@description('The domain name of the web endpoint of the storage account')
param storageAccountWebEndpointDomainName string

@description('The custom domain name of the web endpoint of the storage account')
param customDomainName string

resource verifiedIdDomainVerificationCdnProfile 'Microsoft.Cdn/profiles@2022-11-01-preview' = {
  name: '${resourcePrefix}-did'
  location: 'global'
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
}

resource verifiedIdDomainVerificationCdnEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  name: '${resourcePrefix}-did-endpoint'
  parent: verifiedIdDomainVerificationCdnProfile
  location: 'global'
  properties: {
    enabledState: 'Enabled'
  }
}

resource verifiedIdDomainVerificationCdnOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  name: '${resourcePrefix}-did-origin-groups'
  parent: verifiedIdDomainVerificationCdnProfile
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Http'
      probeIntervalInSeconds: 100
    }
  }
}

resource verifiedIdDomainVerificationCdnOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  name: '${resourcePrefix}-did-origin'
  parent: verifiedIdDomainVerificationCdnOriginGroup
  properties: {
    hostName: storageAccountWebEndpointDomainName
    httpPort: 80
    httpsPort: 443
    originHostHeader: storageAccountWebEndpointDomainName
    priority: 1
    weight: 1000
  }
}

resource verifiedIdDomainVerificationCdnProfileCustomDomain 'Microsoft.Cdn/profiles/customDomains@2023-07-01-preview' = {
  name: '${resourcePrefix}-did-custom-domain'
  parent: verifiedIdDomainVerificationCdnProfile
  properties: {
    hostName: customDomainName
  }
}

resource verifiedIdDomainVerificationCdnRouteRuleSet 'Microsoft.Cdn/profiles/ruleSets@2023-05-01' = {
  name: 'verifiedIdDomainVerificationCdnRouteRuleSet'
  parent: verifiedIdDomainVerificationCdnProfile
}

resource verifiedIdDomainVerificationCdnRouteRedirectToHttpsRule 'Microsoft.Cdn/profiles/ruleSets/rules@2023-05-01' = {
  name: 'RedirectToHttps'
  parent: verifiedIdDomainVerificationCdnRouteRuleSet
  properties: {
    actions: [
      {
        name: 'UrlRedirect'
        parameters: {
          typeName: 'DeliveryRuleUrlRedirectActionParameters'
          redirectType: 'Found'
          destinationProtocol: 'Https'
        }
      }
    ]
    conditions: [
      {
        name: 'RequestScheme'
        parameters: {
          typeName: 'DeliveryRuleRequestSchemeConditionParameters'
          operator: 'Equal'
          negateCondition: false
          matchValues: [ 'HTTP' ]
        }
      }
    ]
    order: 1
  }
}

resource verifiedIdDomainVerificationCdnRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  name: '${resourcePrefix}-did-endpoint-route'
  parent: verifiedIdDomainVerificationCdnEndpoint
  dependsOn: [
    verifiedIdDomainVerificationCdnOrigin
  ]
  properties: {
    ruleSets: [
      {
        id: verifiedIdDomainVerificationCdnRouteRuleSet.id
      }
    ]
    customDomains: [
      {
        id: verifiedIdDomainVerificationCdnProfileCustomDomain.id
      }
    ]
    originGroup: {
      id: verifiedIdDomainVerificationCdnOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    cacheConfiguration: {
      queryStringCachingBehavior: 'IgnoreQueryString'
      compressionSettings: {
        isCompressionEnabled: true
        contentTypesToCompress: [ 'application/json' ]
      }
    }
  }
}
output cdnEndpointName string = verifiedIdDomainVerificationCdnEndpoint.name
output cdnEndpointHostName string = verifiedIdDomainVerificationCdnEndpoint.properties.hostName
output customDomainValidationDnsTxtRecordName string = '_dnsauth.${verifiedIdDomainVerificationCdnProfileCustomDomain.properties.hostName}'
output customDomainValidationDnsTxtRecordValue string = verifiedIdDomainVerificationCdnProfileCustomDomain.properties.validationProperties.validationToken
output customDomainValidationExpiry string = verifiedIdDomainVerificationCdnProfileCustomDomain.properties.validationProperties.expirationDate
