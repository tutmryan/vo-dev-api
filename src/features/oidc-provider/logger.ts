import { buildBaseRequestInfo } from '@makerx/graphql-core'
import type { Request } from 'express'
import type { Request as KoaRequest } from 'koa'
import { isNil, omitBy } from 'lodash'
import type { KoaContextWithOIDC } from 'oidc-provider'
import { logger, type LoggerWithMetaControl } from '../../logger'

/** OIDC context included in log metadata for request correlation */
export type OidcLogContext = {
  interactionId?: string
  clientId?: string
  accountId?: string
  grantId?: string
}

type LoggerMeta = {
  oidc?: OidcLogContext
}

function redactAuthParams(url: string) {
  return url.replace(/(code|state|session_state|access_token|id_token|error|error_description|error_uri)=[^&]+/g, '$1=[redacted]')
}

export function createRequestInfo(req: Request | KoaRequest) {
  const baseRequestInfo = buildBaseRequestInfo(req as Request) // Align with the graphQl context requestInfo
  return omitBy(
    {
      ...baseRequestInfo,
      url: redactAuthParams(req.url),
    },
    isNil,
  )
}

export function extractOidcLogContext(ctx: KoaContextWithOIDC): OidcLogContext {
  const entities = ctx.oidc.entities
  return omitBy(
    {
      accountId: entities.Session?.accountId,
      clientId: entities.Client?.clientId,
      interactionId: entities.Interaction?.uid,
      grantId: ctx.oidc.result?.consent?.grantId ?? entities.Grant?.jti,
    },
    isNil,
  ) as OidcLogContext
}

export function buildRequestLogger(req: Request | KoaRequest, meta?: LoggerMeta): LoggerWithMetaControl {
  const requestLogger = logger.child({ requestInfo: createRequestInfo(req) })
  if (meta) requestLogger.mergeMeta(omitBy(meta, isNil))
  return requestLogger
}

export function buildOidcRequestLogger(ctx: KoaContextWithOIDC): LoggerWithMetaControl {
  return buildRequestLogger(ctx.request, { oidc: extractOidcLogContext(ctx) })
}
