import type { Request } from 'express'
import { decodeJwt } from 'jose'
import type Provider from 'oidc-provider'
import type { OIDCContext } from 'oidc-provider'
import { logger as globalLogger } from '../../logger'
import { redactValueEmail, redactValueInner, redactValueObjectUnknown } from '../../util/redact-values'
import { deleteAccount } from './account'
import { buildRequestLogger, createRequestInfo } from './logger'

type Middleware = Parameters<Provider['use']>[0]
type Context = Parameters<Middleware>[0]

export const middleware: Middleware = async (ctx, next) => {
  const logger = buildRequestLogger(ctx.request)
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
    let idToken: object | undefined
    if (ctx.path === '/token' && ctx.method === 'POST' && 'id_token' in ctx.body) {
      const decodedIdToken = decodeJwt(ctx.body.id_token as string)
      idToken = {
        sub: redactValueEmail(decodedIdToken.sub),
        ...redactValueObjectUnknown(decodedIdToken),
      }
    }
    logger.verbose(`post OIDC middleware: ${ctx.method} ${ctx.path}`, {
      ...buildLogOutput(ctx, oidc),
      ...(idToken ? { idToken } : {}),
    })
  }
}

function deleteAccountOnLogout(ctx: Context, oidc: OIDCContext) {
  const logger = buildRequestLogger(ctx.request)
  if (oidc.route === 'end_session') {
    const accountId = oidc.entities.IdTokenHint?.payload.sub as string | undefined
    if (accountId) {
      logger.audit(`OIDC account logged out`, { accountId, request: createRequestInfo(ctx.req as Request) })
      deleteAccount(accountId).catch((error) => {
        logger.error(`Failed to delete OIDC account ${accountId}`, { error })
      })
    }
  }
}

function checkOidcRequestLogging(ctx: Context) {
  if (!globalLogger.isVerboseEnabled()) return false
  if (ctx.method === 'OPTIONS') return false
  if (ctx.path.endsWith('/.well-known/openid-configuration')) return false
  if (ctx.path.endsWith('/jwks')) return false
  return true
}

function buildLogOutput(ctx: Context, oidc: OIDCContext) {
  const { method, path } = ctx
  const { route } = oidc
  const { Client, Interaction, AccessToken, IdTokenHint, RefreshToken } = oidc.entities
  return {
    method,
    path,
    route,
    requester: {
      ipAddress: ctx.ip || 'unknown',
      ipAddresses: ctx.ips,
      userAgent: ctx.headers['user-agent'] || 'unknown',
    },
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
          ...redactValueObjectUnknown(IdTokenHint.payload),
          sub: redactValueEmail(IdTokenHint.payload.sub),
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
            client_id: Interaction.params.client_id,
            code_challenge: redactValueInner(Interaction.params.code_challenge),
            code_challenge_method: Interaction.params.code_challenge_method,
            redirect_uri: Interaction.params.redirect_uri,
            resource: Interaction.params.resource,
            response_type: Interaction.params.response_type,
            scope: Interaction.params.scope,
            state: redactValueInner(Interaction.params.state),
            nonce: redactValueInner(Interaction.params.nonce),
            prompt: Interaction.params.prompt,
            response_mode: Interaction.params.response_mode,
            vc_type: Interaction.params.vc_type,
            login_hint: redactValueInner(Interaction.params.login_hint),
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
                  'prompt',
                  'response_mode',
                  'vc_type',
                  'login_hint',
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
          ...(AccessToken.extra
            ? {
                ...redactValueObjectUnknown(AccessToken.extra),
                acr: AccessToken.extra.acr,
                amr: AccessToken.extra.amr,
                sub: redactValueEmail(AccessToken.extra.sub),
                ...(AccessToken.extra.email_verified ? { email_verified: AccessToken.extra.email_verified } : {}),
              }
            : undefined),
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
