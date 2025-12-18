import { decodeJwt } from 'jose'
import type Provider from 'oidc-provider'
import type { AccessToken, OIDCContext, RefreshToken } from 'oidc-provider'
import { AuditEvents } from '../../audit-types'
import { logger as globalLogger } from '../../logger'
import { redactValueEmail, redactValueInner, redactValueObjectUnknown } from '../../util/redact-values'
import { deleteAccount } from './account'
import { buildRequestLogger } from './logger'

type Middleware = Parameters<Provider['use']>[0]
type Context = Parameters<Middleware>[0]

export const middleware: Middleware = async (ctx, next) => {
  const logger = buildRequestLogger(ctx.request)
  const logRequest = shouldLogRequest(ctx)
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
  if (oidc.route === 'end_session') {
    const accountId = oidc.entities.IdTokenHint?.payload.sub as string | undefined
    if (accountId) {
      const logger = buildRequestLogger(ctx.request, {
        oidc: { accountId, clientId: oidc.entities.Client?.clientId },
      })
      logger.auditEvent(AuditEvents.OIDC_SESSION_ENDED)
      deleteAccount(accountId).catch((error) => {
        logger.error(`Failed to delete OIDC account`, { error })
      })
    }
  }
}

function shouldLogRequest(ctx: Context) {
  if (!globalLogger.isVerboseEnabled()) return false
  if (ctx.method === 'OPTIONS') return false
  if (ctx.path.endsWith('/.well-known/openid-configuration')) return false
  if (ctx.path.endsWith('/jwks')) return false
  return true
}

const logObjectWithRest = <T extends Record<string, any>>(
  obj: T,
  getterOrValues: Partial<{ [K in keyof T]: (value: T[K]) => any | any }>,
): Record<keyof T, any> & { ['(otherKeys)']: (keyof T)[] } => {
  const transformed = Object.entries(getterOrValues).map(([key, getterOrValue]) =>
    getterOrValue ? { [key]: typeof getterOrValue === 'function' ? getterOrValue(obj[key]) : getterOrValue } : {},
  )
  const otherKeys = (Object.keys(obj) as (keyof T)[]).filter((key) => !(key in getterOrValues))

  return Object.assign({}, ...transformed, { ['(otherKeys)']: otherKeys })
}

function buildLogOutput(ctx: Context, oidc: OIDCContext) {
  const { method, path } = ctx
  const { route } = oidc
  const { Client, Interaction, PushedAuthorizationRequest, AccessToken, IdTokenHint, RefreshToken } = oidc.entities

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
    idTokenHint: IdTokenHint && {
      ...redactValueObjectUnknown(IdTokenHint.payload),
      sub: redactValueEmail(IdTokenHint.payload.sub),
    },
    interaction: Interaction && {
      returnTo: Interaction.returnTo,
      prompt: {
        name: Interaction.prompt.name,
        reasons: Interaction.prompt.reasons,
      },
      params: logObjectWithRest(Interaction.params, {
        client_id: (v) => v,
        code_challenge: (v) => redactValueInner(v),
        code_challenge_method: (v) => v,
        redirect_uri: (v) => v,
        resource: (v) => v,
        response_type: (v) => v,
        scope: (v) => v,
        state: (v) => redactValueInner(v),
        nonce: (v) => redactValueInner(v),
        prompt: (v) => v,
        response_mode: (v) => v,
        vc_type: (v) => v,
        login_hint: (v) => redactValueInner(v),
      }),
    },
    pushedAuthorizationRequest:
      PushedAuthorizationRequest &&
      logObjectWithRest(PushedAuthorizationRequest, {
        exp: (v) => v,
        isExpired: (v) => v,
        isValid: (v) => v,
        remainingTTL: (v) => v,
        request: (v) =>
          logObjectWithRest(decodeJwt(v), {
            acr_values: (v) => v,
            client_id: (v) => v,
            code_challenge: (v) => redactValueInner(v),
            code_challenge_method: (v) => v,
            redirect_uri: (v) => v,
            response_type: (v) => v,
            scope: (v) => v,
            state: (v) => redactValueInner(v),
            nonce: (v) => redactValueInner(v),
            prompt: (v) => v,
            response_mode: (v) => v,
          }),
      }),
    accessToken:
      AccessToken &&
      logObjectWithRest(AccessToken as AccessToken & { expiresIn: number; grantType: string }, {
        accountId: (v) => v,
        aud: (v) => v,
        clientId: (v) => v,
        expiresIn: (v) => v,
        format: (v) => v,
        grantType: (v) => v,
        jti: (v) => v,
        scope: (v) => v,
        tokenType: (v) => v,
        ...(AccessToken.extra && {
          ...redactValueObjectUnknown(AccessToken.extra),
          acr: AccessToken.extra.acr,
          amr: AccessToken.extra.amr,
          sub: redactValueEmail(AccessToken.extra.sub),
          ...(AccessToken.extra.email_verified ? { email_verified: AccessToken.extra.email_verified } : {}),
        }),
      }),
    refreshToken:
      RefreshToken &&
      logObjectWithRest(RefreshToken as RefreshToken & { expiresIn: number; grantType: string; tokenType: string }, {
        accountId: (v) => v,
        clientId: (v) => v,
        acr: (v) => v,
        amr: (v) => v,
        expiresIn: (v) => v,
        grantType: (v) => v,
        jti: (v) => v,
        resource: (v) => v,
        scopes: (v) => v,
        tokenType: (v) => v,
      }),
  }
}
