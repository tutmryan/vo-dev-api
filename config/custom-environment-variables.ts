import type { Config } from '../src/config'

type EnvVarParsingRule = { __name: string; __format: string }

type EnvVarSubstitution<T> = {
  [key in keyof T]?:
    | Uppercase<string>
    | EnvVarParsingRule
    | (NonNullable<T[key]> extends object ? EnvVarSubstitution<NonNullable<T[key]>> : never)
}

const json = <T extends Uppercase<string>>(varName: T): { __name: T; __format: 'json' } => ({
  __name: varName,
  __format: 'json',
})

const config: EnvVarSubstitution<Config> = {
  cors: {
    origin: json('CORS_ORIGIN'),
  },
  server: {
    port: json('PORT'),
  },
  cookieSession: {
    secret: 'COOKIE_SECRET',
  },
  logging: {
    consoleOptions: {
      silent: json('SILENT_CONSOLE'),
    },
    loggerOptions: {
      defaultMeta: {
        version: 'VERSION',
      },
      level: 'LOG_LEVEL',
    },
  },
  auditLogStreaming: {
    dataCollectionEndpoint: 'AUDIT_DATA_COLLECTION_ENDPOINT',
    dataCollectionRuleId: 'AUDIT_DATA_COLLECTION_RULE_ID',
    dataCollectionClientId: 'AUDIT_DATA_COLLECTION_CLIENT_ID',
    dataCollectionClientSecret: 'AUDIT_DATA_COLLECTION_CLIENT_SECRET',
  },
  instance: 'INSTANCE',
  version: 'VERSION',
  devToolsEnabled: json('DEV_TOOLS_ENABLED'),
  faceCheckEnabled: json('FACE_CHECK_ENABLED'),
  demoEnabled: json('DEMO_ENABLED'),
  oidcEnabled: json('OIDC_ENABLED'),
  mdocEnabled: json('MDOC_ENABLED'),
  authorityId: 'VID_AUTHORITY_ID',
  database: {
    host: 'DATABASE_HOST',
    port: json('DATABASE_PORT'),
    database: 'DATABASE_NAME',
    username: 'DATABASE_USERNAME',
    password: 'DATABASE_PASSWORD',
    logging: json('DATABASE_LOGGING'),
  },
  redis: {
    host: 'REDIS_HOST',
    port: 'REDIS_PORT',
    key: 'REDIS_KEY',
  },
  blobStorage: {
    url: 'BLOB_STORAGE_URL',
  },
  privateBlobStorage: {
    url: 'PRIVATE_BLOB_STORAGE_URL',
    clientEncryptionKey: 'PRIVATE_STORAGE_ENCRYPTION_KEY',
  },
  oidcKeyVaultUrl: 'OIDC_KEY_VAULT_URL',
  identityStoreKeyVaultUrl: 'IDENTITY_STORE_KEY_VAULT_URL',
  sms: {
    secret: 'SMS_SECRET',
    primaryToken: 'SMS_PRIMARY_TOKEN',
  },
  email: {
    apiKey: 'EMAIL_API_KEY',
    webhookForwarder: {
      url: 'EMAIL_WEBHOOK_FORWARDER_URL',
      secret: 'EMAIL_WEBHOOK_FORWARDER_SECRET',
    },
  },
  homeTenant: {
    name: 'HOME_TENANT_NAME',
    tenantId: 'HOME_TENANT_ID',
    graphCredentials: {
      clientId: 'HOME_TENANT_GRAPH_CLIENT_ID',
      clientSecret: 'HOME_TENANT_GRAPH_CLIENT_SECRET',
    },
    vidServiceCredentials: {
      clientId: 'HOME_TENANT_VID_SERVICE_CLIENT_ID',
      clientSecret: 'HOME_TENANT_VID_SERVICE_CLIENT_SECRET',
    },
  },
  platformTenant: {
    tenantId: 'PLATFORM_TENANT_ID',
  },
  apiClient: {
    credentials: {
      clientId: 'API_CLIENT_ID',
      clientSecret: 'API_CLIENT_SECRET',
    },
    uri: 'API_CLIENT_URI',
  },
  internalClient: {
    credentials: {
      clientId: 'INTERNAL_CLIENT_ID',
      clientSecret: 'INTERNAL_CLIENT_SECRET',
    },
    uri: 'INTERNAL_CLIENT_URI',
  },
  auth: {
    pkce: {
      msalConfig: {
        auth: {
          clientSecret: 'API_CLIENT_SECRET',
        },
      },
    },
    additionalAuthTenantIds: json('ADDITIONAL_AUTH_TENANT_IDS'),
  },
  limitedAccess: {
    credentials: {
      clientSecret: 'LIMITED_ACCESS_CLIENT_SECRET',
    },
    secret: 'LIMITED_ACCESS_SECRET',
  },
  limitedApproval: {
    credentials: {
      clientSecret: 'LIMITED_APPROVAL_CLIENT_SECRET',
    },
    secret: 'LIMITED_APPROVAL_SECRET',
  },
  limitedPhotoCapture: {
    credentials: {
      clientSecret: 'LIMITED_PHOTO_CAPTURE_CLIENT_SECRET',
    },
    secret: 'LIMITED_PHOTO_CAPTURE_SECRET',
  },
  limitedAsyncIssuance: {
    credentials: {
      clientSecret: 'LIMITED_ASYNC_ISSUANCE_CLIENT_SECRET',
    },
    secret: 'LIMITED_ASYNC_ISSUANCE_SECRET',
  },
  limitedDemo: {
    credentials: {
      clientSecret: 'LIMITED_DEMO_CLIENT_SECRET',
    },
  },
  limitedOidcClient: {
    credentials: {
      clientSecret: 'LIMITED_OIDC_CLIENT_SECRET',
    },
    secret: 'LIMITED_OIDC_SECRET',
  },
  callbackCredentials: {
    clientId: 'VID_CALLBACK_CLIENT_ID',
    clientSecret: 'VID_CALLBACK_CLIENT_SECRET',
  },
  identityIssuers: {
    tenantId: 'HOME_TENANT_NAME',
    ...json('IDENTITY_ISSUERS'),
  },
  platformConsumerApps: json('PLATFORM_CONSUMER_APPS'),
  localDev: {
    tunnel: {
      api: 'LOCAL_DEV_TUNNEL_API',
      portal: 'LOCAL_DEV_TUNNEL_PORTAL',
    },
    email: {
      disabled: json('LOCAL_DEV_EMAIL_DISABLED'),
      allowList: json('LOCAL_DEV_EMAIL_ALLOW_LIST'),
    },
    sms: {
      disabled: json('LOCAL_DEV_SMS_DISABLED'),
      allowList: json('LOCAL_DEV_SMS_ALLOW_LIST'),
    },
  },
  graphQL: {
    maxAliases: json('GRAPHQL_MAX_ALIASES'),
    maxDepth: json('GRAPHQL_MAX_DEPTH'),
    maxDirectives: json('GRAPHQL_MAX_DIRECTIVES'),
    maxTokens: json('GRAPHQL_MAX_TOKENS'),
  },
}

export default config
