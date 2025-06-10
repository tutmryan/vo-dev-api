import type { Request } from 'express'
import { decodeJwt } from 'jose'
import type { Context } from 'koa'
import { isNil, omitBy } from 'lodash'
import type Provider from 'oidc-provider'
import type { KoaContextWithOIDC } from 'oidc-provider'
import { logger } from '../../logger'
import { redactValueObjectUnknown } from '../../util/redact-values'

export function createRequestInfo(req: Request) {
  return omitBy(
    {
      protocol: req.protocol as 'http' | 'https',
      host: req.hostname,
      method: req.method,
      url: redactAuthParams(req.originalUrl),
      origin: req.get('Origin') ?? undefined,
      referer: req.headers.referer?.toString() ?? undefined,
      clientIp: req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress,
      userAgent: req.headers['user-agent']?.toString() ?? undefined,
    },
    isNil,
  )
}

function createOidcInfo(ctx: KoaContextWithOIDC) {
  return omitBy(
    {
      accountId: ctx.oidc.session?.accountId,
      clientId: ctx.oidc.client?.client_id,
    },
    isNil,
  )
}

function redactAuthParams(url: string) {
  return url.replace(/(code|state|session_state|access_token|id_token|error|error_description|error_uri)=[^&]+/g, '$1=[redacted]')
}

function createLogParams(ctx: KoaContextWithOIDC) {
  return {
    oidc: createOidcInfo(ctx),
    request: createRequestInfo(ctx.req as Request),
  }
}

function hasIdToken(response: unknown): response is { id_token: string } {
  return typeof response === 'object' && response !== null && 'id_token' in response
}

export function logEvents(provider: Provider) {
  provider.on('authorization.success', (_ctx: Context, response: unknown) => {
    if (logger.isVerboseEnabled() && hasIdToken(response)) {
      // When the response_type is id_token, we log the decoded id_token here for debugging purposes.
      logger.verbose('OIDC event: authorization.success (id_token)', {
        idToken: redactValueObjectUnknown(decodeJwt(response.id_token)),
      })
    }
  })
  provider.on('authorization.error', (ctx, err) => {
    logger.error('OIDC event: authorization.error', { ...createLogParams(ctx), error: err })
  })
  provider.on('end_session.error', (ctx, err) => {
    logger.error('OIDC event: end_session.error', { ...createLogParams(ctx), error: err })
  })
  provider.on('grant.error', (ctx, err) => {
    logger.error('OIDC event: grant.error', { ...createLogParams(ctx), error: err })
  })

  provider.on('discovery.error', (ctx, err) => {
    logger.error('OIDC event: discovery.error', { ...createLogParams(ctx), error: err })
  })
  provider.on('introspection.error', (ctx, err) => {
    logger.error('OIDC event: introspection.error', { ...createLogParams(ctx), error: err })
  })
  provider.on('jwks.error', (ctx, err) => {
    logger.error('OIDC event: jwks.error', { ...createLogParams(ctx), error: err })
  })

  provider.on('registration_create.success', (ctx, client) => {
    logger.audit('OIDC event: registration_create.success', { ...createLogParams(ctx), client })
  })
  provider.on('registration_create.error', (ctx, err) => {
    logger.error('OIDC event: registration_create.error', { ...createLogParams(ctx), error: err })
  })
  provider.on('registration_delete.success', (ctx, client) => {
    logger.audit('OIDC event: registration_delete.success', { ...createLogParams(ctx), client })
  })
  provider.on('registration_delete.error', (ctx, err) => {
    logger.error('OIDC event: registration_delete.error', { ...createLogParams(ctx), error: err })
  })
  provider.on('registration_read.error', (ctx, err) => {
    logger.error('OIDC event: registration_read.error', { ...createLogParams(ctx), error: err })
  })
  provider.on('registration_update.success', (ctx, client) => {
    logger.audit('OIDC event: registration_update.success', { ...createLogParams(ctx), client })
  })
  provider.on('registration_update.error', (ctx, err) => {
    logger.error('OIDC event: registration_update.error', { ...createLogParams(ctx), error: err })
  })

  provider.on('pushed_authorization_request.success', (ctx) => {
    logger.audit('OIDC event: pushed_authorization_request.success', createLogParams(ctx))
  })
  provider.on('pushed_authorization_request.error', (ctx, err) => {
    logger.error('OIDC event: pushed_authorization_request.error', { ...createLogParams(ctx), error: err })
  })

  provider.on('backchannel.success', (ctx, client, accountId, sid) => {
    logger.audit('OIDC event: backchannel.success', { ...createLogParams(ctx), client, accountId, sid })
  })
  provider.on('backchannel.error', (ctx, err) => {
    logger.error('OIDC event: backchannel.error', { ...createLogParams(ctx), error: err })
  })
}
