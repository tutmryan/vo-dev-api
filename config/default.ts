import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  cors: {
    maxAge: 84000,
    credentials: true,
    origin: [],
  },
  logging: {
    redactPaths: [
      'headers.authorization',
      'notification.value',
      'verification.value',
      'pin.value',
      'data.createIssuanceRequest.qrCode',
      'data.createIssuanceRequest.url',
      'data.createPresentationRequest.qrCode',
      'data.createPresentationRequest.url',
      'verificationCode',
      'email',
      'token',
      'photo',
    ],
    userClaimsToLog: ['oid', 'aud', 'tid', 'azp', 'iss', 'scp', 'roles'],
    requestInfoToLog: ['origin', 'requestId', 'correlationId', 'clientIp'],
    omitPaths: [],
    loggerOptions: {
      defaultMeta: {
        service: 'verified-orchestration-api',
      },
      level: 'audit',
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
    port: 1433,
    logging: true,
  },
  blobStorage: {
    logoImagesContainer: 'logo-images',
  },
  privateBlobStorage: {
    asyncIssuanceContainer: 'async-issuance',
    oidcContainer: 'oidc',
  },
  sms: {
    accountSid: 'AC860727ab860a86187f00a15bb05bd812',
    from: { AU: '+61483984493', US: '+15709124097' },
  },
  email: {
    from: {
      name: 'Verified Orchestration',
      email: 'no-reply@verifiedorchestration.com',
    },
    templates: {
      issuance: { id: 'd-8500cff9c1ba4bdc9326a46d85f93632', asm: { groupId: 26962, groupsToDisplay: [26962] } },
      verification: { id: 'd-a2af5a4bcad04f4392b51f7023106f2a', asm: { groupId: 27199, groupsToDisplay: [27199] } },
    },
  },
  auth: {
    pkce: {
      logoutUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
      msalConfig: {
        system: {
          loggerOptions: {
            piiLoggingEnabled: false,
            logLevel: 0,
          },
        },
      },
    },
    bearer: {},
    additionalAuthTenantIds: [],
  },
  verifiedIdAdmin: {
    baseUrl: 'https://verifiedid.did.msidentity.com/v1.0/',
    // See https://learn.microsoft.com/en-us/entra/verified-id/admin-api#authentication
    scope: '6a8b4b39-c021-437c-b060-5a14a3fd65f3/.default',
  },
  verifiedIdRequest: {
    baseUrl: 'https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/',
    // See https://learn.microsoft.com/en-us/entra/verified-id/vc-network-api#authentication
    scope: '3db474b9-6a0c-4840-96ac-1fceb342124f/.default',
  },
  issuanceCallbackRoute: '/issuance/callback',
  presentationCallbackRoute: '/presentation/callback',
  issuanceRequestRegistration: {
    clientName: 'Verified Orchestration Platform',
  },
  platformConsumerApps: {},
  identityIssuers: {
    manual: 'Manually Issued',
  },
  devToolsEnabled: true,
  faceCheckEnabled: true,
  oidcEnabled: true,
  graphQL: {
    maxAliases: 30,
    maxDirectives: 50,
    maxDepth: 12,
    maxTokens: 2500,
  },
}

module.exports = config
