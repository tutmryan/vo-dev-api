import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const tokenUrl = 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/oauth2/v2.0/token'

const config: DeepPartial<Config> = {
  logging: {
    userClaimsToLog: ['oid', 'aud', 'tid', 'azp', 'iss', 'scp', 'roles'],
    requestInfoToLog: ['origin', 'requestId', 'correlationId'],
    omitPaths: [],
    loggerOptions: {
      defaultMeta: {
        service: 'verified-orchestation-api',
      },
      level: 'info',
    },
    consoleOptions: {
      silent: false,
    },
  },
  cookieSession: {
    maxAge: 3600000,
    sameSite: 'none',
    secure: true,
    httpOnly: true,
  },
  database: {
    database: 'VerifiedOrchestration',
    port: 1433,
    logging: true,
  },
  blobStorage: {
    logoImagesContainer: 'logo-images',
  },
  auth: {
    pkce: {
      logoutUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
      enabled: false,
      msalConfig: {
        system: {
          loggerOptions: {
            piiLoggingEnabled: false,
            logLevel: 0,
          },
        },
      },
    },
  },
  homeTenantGraph: {
    auth: {
      tenantId: 'a4577872-4a36-4a93-9846-b29a1220ca89',
    },
    tenantName: 'verifiedorchestration.com',
  },
  limitedAccessClient: {
    tokenUrl,
  },
  sendgrid: {
    templates: {
      onboarding: {
        kycPath: '/',
        issuancePath: '/credentials/issue',
        mailData: { templateId: 'd-8c0c050b6a94416f9c6936b305ccb3ee', from: { email: 'sam.curry@makerx.com.au', name: 'Sam Curry' } },
      },
    },
  },
  integrations: {
    verifiedIdAdmin: {
      baseUrl: 'https://verifiedid.did.msidentity.com/v1.0/',
      auth: {
        tokenUrl,
        // See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#authentication
        scope: '6a8b4b39-c021-437c-b060-5a14a3fd65f3/.default',
      },
    },
    verifiedIdRequest: {
      baseUrl: 'https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/',
      auth: {
        tokenUrl,
        scope: '3db474b9-6a0c-4840-96ac-1fceb342124f/.default',
      },
    },
    b2cGraph: {
      auth: {
        tenantId: '10b631d3-9e47-49e1-a938-cbd933f0488d',
      },
      tenantName: 'voonboardingdemo.onmicrosoft.com',
    },
  },
  issuanceCallback: {
    route: '/issuance/callback',
    auth: {
      tokenUrl,
    },
  },
  presentationCallback: {
    route: '/presentation/callback',
    auth: {
      tokenUrl,
    },
  },
  issuanceRequestRegistration: {
    clientName: 'Verified Orchestration Platform',
  },
  platformConsumerApps: {
    '5d988fea-e182-4527-bd3a-a4f743121b33': { name: 'Onboarding Demo API (localdev)' },
    'dc8366b4-ba83-48e5-8ab2-9a852a4500c6': { name: 'Onboarding Demo API' },
    '682447f2-12b8-4ec1-a78e-fef3bf5e42f5': { name: 'Limited Access Client' },
    'a774bb59-1fb3-47c7-bbe3-d666fe3f6ca8': { name: 'Barhead Demo' },
  },
  identityIssuers: {
    manual: { name: 'Manually Issued' },
    'a4577872-4a36-4a93-9846-b29a1220ca89': { name: 'verifiedorchestration.com' },
    '10b631d3-9e47-49e1-a938-cbd933f0488d': { name: 'voonboardingdemo.onmicrosoft.com' },
  },
}

module.exports = config
