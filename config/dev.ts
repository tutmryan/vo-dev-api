import { LogLevel } from '@azure/msal-node'
import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const tenantName = 'verifiedorchestration.com'
const tenantId = 'a4577872-4a36-4a93-9846-b29a1220ca89'
const apiDefaultScope = 'api://verified-orchestration-api-dev/.default'
const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

const config: DeepPartial<Config> = {
  cors: {
    origin: true,
    credentials: true,
    maxAge: 84000,
  },
  redis: {
    host: 'vo-dev-verified-orchestration-redis.redis.cache.windows.net',
  },
  blobStorage: {
    url: 'https://vodevvrfdorchstnst.blob.core.windows.net',
  },
  auth: {
    bearer: {
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      verifyOptions: {
        issuer: `https://sts.windows.net/${tenantId}/`,
        audience: ['api://verified-orchestration-api-dev'],
      },
    },
    pkce: {
      enabled: true,
      scopes: [apiDefaultScope, 'profile'],
      logoutUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout`,
      msalConfig: {
        auth: {
          // Verified Orchestration API UI (dev)
          // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/0a675e3c-e076-4ebf-97f2-125d3e6ce9f8/isMSAApp~/false
          clientId: '0a675e3c-e076-4ebf-97f2-125d3e6ce9f8',
          authority: `https://login.microsoftonline.com/${tenantId}`,
          knownAuthorities: [`https://login.microsoftonline.com/${tenantId}`],
        },
        system: {
          loggerOptions: {
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
          },
        },
      },
    },
  },
  homeTenantGraph: {
    auth: {
      tenantId,
      clientId: 'e53f942c-c727-4db9-a857-988bae3e07b6',
    },
    tenantName,
  },
  limitedAccessClient: {
    clientId: '53022c73-6efc-406b-873a-8916c3451006',
    scope: apiDefaultScope,
    tokenUrl,
  },
  integrations: {
    verifiedIdAdmin: {
      authorityId: '9568e470-f1e8-755f-94df-19e75efd45a1',
      auth: {
        // Verified Orchestration API (dev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/e53f942c-c727-4db9-a857-988bae3e07b6/isMSAApp~/false
        clientId: 'e53f942c-c727-4db9-a857-988bae3e07b6',
        tokenUrl,
      },
    },
    verifiedIdRequest: {
      auth: {
        // Verified Orchestration API (dev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/e53f942c-c727-4db9-a857-988bae3e07b6/isMSAApp~/false
        clientId: 'e53f942c-c727-4db9-a857-988bae3e07b6',
        tokenUrl,
      },
    },
  },
  issuanceCallback: {
    auth: {
      // Verified Orchestration VID callback (dev)
      // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/836da20a-6fab-483a-9153-08f8673b9eb2/isMSAApp~/false
      clientId: '836da20a-6fab-483a-9153-08f8673b9eb2',
      scope: apiDefaultScope,
      tokenUrl,
    },
  },
  presentationCallback: {
    auth: {
      // Verified Orchestration VID callback (dev)
      // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/836da20a-6fab-483a-9153-08f8673b9eb2/isMSAApp~/false
      clientId: '836da20a-6fab-483a-9153-08f8673b9eb2',
      scope: apiDefaultScope,
      tokenUrl,
    },
  },
  platformConsumerApps: {
    '5d988fea-e182-4527-bd3a-a4f743121b33': { name: 'Onboarding Demo API (localdev)' },
    'dc8366b4-ba83-48e5-8ab2-9a852a4500c6': { name: 'Onboarding Demo API' },
    '682447f2-12b8-4ec1-a78e-fef3bf5e42f5': { name: 'Limited Access Client' },
    'a774bb59-1fb3-47c7-bbe3-d666fe3f6ca8': { name: 'Barhead Demo' },
    '730966fe-a5f8-4227-b30b-63626a28188f': { name: 'NDIS Demo' },
    '8db8c852-e896-496d-9b3b-fd6911836f4e': { name: 'Arpansa Demo' },
  },
  identityIssuers: {
    manual: { name: 'Manually Issued' },
    tenantId: { name: tenantName },
    '10b631d3-9e47-49e1-a938-cbd933f0488d': { name: 'voonboardingdemo.onmicrosoft.com' },
  },
}

module.exports = config
