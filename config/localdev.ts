import { LogLevel } from '@azure/msal-node'
import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const homeTenantName = 'verifiedorchestration.com'
const homeTenantId = 'a4577872-4a36-4a93-9846-b29a1220ca89'
const homeTenantClientId = '3f0968a8-aaf0-407a-b7e9-826d82f0f6a9'

const platformTenantId = '5c14bb50-7602-4c0d-b785-5dee865e4665'
const platformApiClientId = 'c015d766-3423-4d30-8fbc-014191d27825'
const platformApiDefaultScope = `${platformApiClientId}/.default`
const platformTokenUrl = `https://login.microsoftonline.com/${platformTenantId}/oauth2/v2.0/token`

const limitedAccessClientId = '5869060c-373e-4eef-97de-967cfb2d6a92'
const limitedAccessTokenAudience = 'api://verified-orchestration-internal-non-prod'
const vidCallbackClientId = '2e2b9262-ec52-45da-95bb-4db42286ab52'

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
      jwksUri: `https://login.microsoftonline.com/${homeTenantId}/discovery/v2.0/keys`,
      verifyOptions: {
        issuer: [`https://sts.windows.net/${homeTenantId}/`, `https://sts.windows.net/${platformTenantId}/`],
        audience: [platformApiClientId, limitedAccessTokenAudience],
        clockTolerance: 5,
      },
    },
    pkce: {
      enabled: true,
      scopes: [platformApiDefaultScope, 'profile'],
      logoutUrl: `https://login.microsoftonline.com/${homeTenantId}/oauth2/v2.0/logout`,
      msalConfig: {
        auth: {
          // Verified Orchestration (non prod)
          // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/c015d766-3423-4d30-8fbc-014191d27825/isMSAApp~/false
          clientId: platformApiClientId,
          authority: `https://login.microsoftonline.com/${platformTenantId}`,
          knownAuthorities: [`https://login.microsoftonline.com/${platformTenantId}`],
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
      tenantId: homeTenantId,
      clientId: homeTenantClientId,
    },
    tenantName: homeTenantName,
  },
  limitedAccessClient: {
    clientId: limitedAccessClientId,
    scope: `${limitedAccessTokenAudience}/.default`,
    tokenUrl: platformTokenUrl,
  },
  integrations: {
    verifiedIdAdmin: {
      auth: {
        // Verified Orchestration (non prod)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/c015d766-3423-4d30-8fbc-014191d27825/isMSAApp~/false
        clientId: platformApiClientId,
        tokenUrl: platformTokenUrl,
      },
    },
    verifiedIdRequest: {
      auth: {
        // Verified Orchestration (non prod)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/c015d766-3423-4d30-8fbc-014191d27825/isMSAApp~/false
        clientId: platformApiClientId,
        tokenUrl: platformTokenUrl,
      },
    },
  },
  issuanceCallback: {
    auth: {
      // Verified Orchestration VID Callback (non prod)
      // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/2e2b9262-ec52-45da-95bb-4db42286ab52/isMSAApp~/false
      clientId: vidCallbackClientId,
      scope: platformApiDefaultScope,
      tokenUrl: platformTokenUrl,
    },
  },
  presentationCallback: {
    auth: {
      // Verified Orchestration VID Callback (non prod)
      // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/2e2b9262-ec52-45da-95bb-4db42286ab52/isMSAApp~/false
      clientId: vidCallbackClientId,
      scope: platformApiDefaultScope,
      tokenUrl: platformTokenUrl,
    },
  },
  platformConsumerApps: {
    '5d988fea-e182-4527-bd3a-a4f743121b33': { name: 'Onboarding Demo API (localdev)' },
  },
  identityIssuers: {
    manual: { name: 'Manually Issued' },
    tenantId: { name: homeTenantName },
    '10b631d3-9e47-49e1-a938-cbd933f0488d': { name: 'voonboardingdemo.onmicrosoft.com' },
  },
}

module.exports = config
