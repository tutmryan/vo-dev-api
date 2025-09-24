import { buildBaseRequestInfo } from '@makerx/graphql-core'
import type { Request } from 'express'
import type { Request as KoaRequest } from 'koa'
import { isNil, omitBy } from 'lodash'
import { logger, type Logger } from '../../logger'

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

export function buildRequestLogger(req: Request | KoaRequest) {
  return logger.child({ requestInfo: createRequestInfo(req) }) as unknown as Logger // Align with GraphQL logging
}
