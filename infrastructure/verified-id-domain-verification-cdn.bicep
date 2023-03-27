@description('The name of the CDN profile')
param cdnProfileName string

@description('The domain name of the web endpoint of the storage account')
param storageAccountWebEndpointDomainName string

resource verifiedIdDomainVerificationCdnProfile 'Microsoft.Cdn/profiles@2022-11-01-preview' = {
  name: cdnProfileName
  location: 'global'
  sku: {
    name: 'Standard_Microsoft'
  }
}

resource verifiedIdDomainVerificationCdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2022-11-01-preview' = {
  name: '${cdnProfileName}-endpoint'
  location: 'global'
  parent: verifiedIdDomainVerificationCdnProfile
  properties: {
    isHttpAllowed: true
    isHttpsAllowed: true
    optimizationType: 'GeneralWebDelivery'
    originHostHeader: storageAccountWebEndpointDomainName
    origins: [
      {
        name: replace(storageAccountWebEndpointDomainName, '.', '-')
        properties: {
          hostName: storageAccountWebEndpointDomainName
          originHostHeader: storageAccountWebEndpointDomainName
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
    queryStringCachingBehavior: 'IgnoreQueryString'
    isCompressionEnabled: true
    contentTypesToCompress: [ 'application/json' ]
    deliveryPolicy: {
      rules: [
        {
          name: 'RedirectToHttps'
          order: 1
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
        }
        {
          name: 'DoNotCacheJsonFiles'
          order: 2
          conditions: [
            {
              name: 'UrlPath'
              parameters: {
                typeName: 'DeliveryRuleUrlPathMatchConditionParameters'
                operator: 'EndsWith'
                negateCondition: false
                matchValues: [ '.json' ]
                transforms: [ 'Lowercase' ]
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                typeName: 'DeliveryRuleCacheExpirationActionParameters'
                cacheBehavior: 'BypassCache'
                cacheType: 'All'
              }
            }
          ]
        }
      ]
    }
  }
}
