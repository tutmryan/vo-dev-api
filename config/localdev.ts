import { LogLevel } from '@azure/msal-node'
import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const tenantName = 'verifiedorchestration.com'
const tenantId = 'a4577872-4a36-4a93-9846-b29a1220ca89'
const apiDefaultScope = 'api://verified-orchestration-api-localdev/.default'
const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

const config: DeepPartial<Config> = {
  server: {
    port: 4000,
  },
  cors: {
    origin: true,
    credentials: true,
    maxAge: 84000,
  },
  cookieSession: {
    sameSite: 'lax',
    secure: false,
  },
  logging: {
    userClaimsToLog: [],
    requestInfoToLog: [],
    omitPaths: ['service', 'trace_id', 'span_id', 'trace_flags', 'logLevel'],
    loggerOptions: {
      level: 'verbose',
    },
  },
  database: { logging: true },
  redis: { host: 'localhost' },
  blobStorage: {
    url: 'http://127.0.0.1:10000/devstoreaccount1',
    credential: {
      accountName: 'devstoreaccount1',
      accountKey: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
    },
  },
  auth: {
    bearer: {
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      verifyOptions: {
        issuer: `https://sts.windows.net/${tenantId}/`,
        audience: ['api://verified-orchestration-api-localdev'],
        clockTolerance: 5,
      },
    },
    pkce: {
      enabled: true,
      scopes: [apiDefaultScope, 'profile'],
      logoutUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout`,
      msalConfig: {
        auth: {
          // Verified Orchestration API UI (localdev)
          // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/20bcde12-9cbc-4a37-9e69-200a1e210530/isMSAApp~/false
          clientId: '20bcde12-9cbc-4a37-9e69-200a1e210530',
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
      clientId: '3f0968a8-aaf0-407a-b7e9-826d82f0f6a9',
    },
    tenantName,
  },
  limitedAccessClient: {
    clientId: 'c712fd5e-3317-47b8-bb22-c26296661a51',
    scope: apiDefaultScope,
    tokenUrl,
  },
  integrations: {
    verifiedIdAdmin: {
      authorityId: '9568e470-f1e8-755f-94df-19e75efd45a1',
      auth: {
        // Verified Orchestration API (localdev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/3f0968a8-aaf0-407a-b7e9-826d82f0f6a9/isMSAApp~/false
        clientId: '3f0968a8-aaf0-407a-b7e9-826d82f0f6a9',
        tokenUrl,
      },
    },
    verifiedIdRequest: {
      auth: {
        // Verified Orchestration API (localdev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/3f0968a8-aaf0-407a-b7e9-826d82f0f6a9/isMSAApp~/false
        clientId: '3f0968a8-aaf0-407a-b7e9-826d82f0f6a9',
        tokenUrl,
      },
    },
  },
  issuanceCallback: {
    auth: {
      // Verified Orchestration VID callback (localdev)
      // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/bafdce32-e946-4b0a-a630-f7a2fe4229e4/isMSAApp~/false
      clientId: 'bafdce32-e946-4b0a-a630-f7a2fe4229e4',
      scope: apiDefaultScope,
      tokenUrl,
    },
  },
  presentationCallback: {
    auth: {
      // Verified Orchestration VID callback (localdev)
      // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/bafdce32-e946-4b0a-a630-f7a2fe4229e4/isMSAApp~/false
      clientId: 'bafdce32-e946-4b0a-a630-f7a2fe4229e4',
      scope: apiDefaultScope,
      tokenUrl,
    },
  },
  platformConsumerApps: {
    '5d988fea-e182-4527-bd3a-a4f743121b33': { name: 'Onboarding Demo API (localdev)' },
  },
  identityIssuers: {
    manual: { name: 'Manually Issued' },
    tenantId: { name: tenantName },
    '10b631d3-9e47-49e1-a938-cbd933f0488d': { name: 'voonboardingdemo.onmicrosoft.com' },
  },
}

module.exports = config
