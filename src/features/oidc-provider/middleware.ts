import type Provider from 'oidc-provider'
import type { AccessToken, OIDCContext } from 'oidc-provider'
import { logger } from '../../logger'
import { redactValueEmail, redactValueInner, redactValueObjectUnknown } from '../../util/redact-values'
import { deleteAccount } from './account'

type Middleware = Parameters<Provider['use']>[0]
type Context = Parameters<Middleware>[0]

const checkOidcRequestLogging = (ctx: Context) => {
  if (!logger.isVerboseEnabled()) return false
  if (ctx.method === 'OPTIONS') return false
  if (ctx.path.includes('/.well-known/')) return false
  if (ctx.path.endsWith('/jwks')) return false
  return true
}

const buildAccessTokenExtra = (accessToken?: AccessToken) => {
  return accessToken?.extra
    ? {
        acr: accessToken.extra.acr,
        amr: accessToken.extra.amr,
        sub: redactValueEmail(accessToken.extra.sub),
        ...(accessToken.extra.email_verified ? { email_verified: accessToken.extra.email_verified } : {}),
        ...redactValueObjectUnknown(accessToken.extra, ['sub', 'acr', 'amr', 'email_verified']),
      }
    : undefined
}

const buildLogOutput = (ctx: Context, oidc: OIDCContext) => {
  const { method, path } = ctx
  const { route } = oidc
  const { Client, Interaction, AccessToken, IdTokenHint, RefreshToken } = oidc.entities
  return {
    method,
    path,
    route,
    client: {
      id: Client?.clientId,
      name: Client?.clientName,
      applicationType: Client?.applicationType,
      tokenEndpointAuthMethod: Client?.tokenEndpointAuthMethod,
      subjectType: Client?.subjectType,
      grantTypes: Client?.grantTypes,
      redirectUris: Client?.redirectUris,
      postLogoutRedirectUris: Client?.postLogoutRedirectUris,
      idTokenSignedResponseAlg: Client?.idTokenSignedResponseAlg,
    },
    idTokenHint: IdTokenHint
      ? {
          sub: redactValueEmail(IdTokenHint.payload.sub),
          ...redactValueObjectUnknown(IdTokenHint.payload, ['sub']),
        }
      : undefined,
    interaction: Interaction
      ? {
          returnTo: Interaction.returnTo,
          prompt: {
            name: Interaction.prompt.name,
            reasons: Interaction.prompt.reasons,
          },
          params: {
            clientId: Interaction.params.client_id,
            codeChallenge: redactValueInner(Interaction.params.code_challenge),
            codeChallengeMethod: Interaction.params.code_challenge_method,
            redirectUri: Interaction.params.redirect_uri,
            resource: Interaction.params.resource,
            responseType: Interaction.params.response_type,
            scope: Interaction.params.scope,
            state: redactValueInner(Interaction.params.state),
            nonce: redactValueInner(Interaction.params.nonce),
            // Log the keys of params not listed above
            nonLoggedParamKeys: Object.keys(Interaction.params).filter(
              (key) =>
                ![
                  'client_id',
                  'code_challenge',
                  'code_challenge_method',
                  'redirect_uri',
                  'resource',
                  'response_type',
                  'scope',
                  'state',
                  'nonce',
                ].includes(key),
            ),
          },
        }
      : undefined,
    accessToken: AccessToken
      ? {
          accountId: AccessToken.accountId,
          aud: AccessToken.aud,
          clientId: AccessToken.clientId,
          expiresIn: AccessToken.expiration,
          format: AccessToken.format,
          grantType: AccessToken.gty,
          jti: AccessToken.jti,
          scope: AccessToken.scope,
          tokenType: AccessToken.tokenType,
          ...buildAccessTokenExtra(AccessToken),
        }
      : undefined,
    refreshToken: RefreshToken
      ? {
          accountId: RefreshToken.accountId,
          clientId: RefreshToken.clientId,
          acr: RefreshToken.acr,
          amr: RefreshToken.amr,
          expiresIn: RefreshToken.expiration,
          grantType: RefreshToken.gty,
          jti: RefreshToken.jti,
          resource: RefreshToken.resource,
          scopes: RefreshToken.scope,
          tokenType: 'tokenType' in RefreshToken ? RefreshToken.tokenType : undefined,
        }
      : undefined,
  }
}

export const middleware: Middleware = async (ctx, next) => {
  const logRequest = checkOidcRequestLogging(ctx)
  if (logRequest) {
    logger.verbose(`pre OIDC middleware: ${ctx.method} ${ctx.path}`)
  }

  await next()

  // Added by oidc-provider middleware
  const oidc = ctx.oidc as OIDCContext | undefined
  if (!oidc) {
    logger.warn(`No OIDC context found for ${ctx.method} ${ctx.path}`)
    return
  }

  deleteAccountOnLogout(ctx, oidc)

  if (logRequest) {
    logger.verbose(`post OIDC middleware: ${ctx.method} ${ctx.path}`, buildLogOutput(ctx, oidc))
  }
}

function deleteAccountOnLogout(ctx: Context, oidc: OIDCContext) {
  if (oidc.route === 'end_session') {
    const accountId = oidc.entities.IdTokenHint?.payload.sub as string | undefined
    if (accountId) {
      logger.audit(`OIDC account ${accountId} logged out, deleting account`)
      deleteAccount(accountId).catch((error) => {
        logger.error(`Failed to delete OIDC account ${accountId}`, { error })
      })
    }
  }
}
