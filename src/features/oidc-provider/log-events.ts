import { decodeJwt } from 'jose'
import type Provider from 'oidc-provider'
import type { KoaContextWithOIDC } from 'oidc-provider'
import { AuditEvents } from '../../audit-types'
import { redactValueObjectUnknown } from '../../util/redact-values'
import { buildOidcRequestLogger } from './logger'

function hasIdToken(response: unknown): response is { id_token: string } {
  return typeof response === 'object' && response !== null && 'id_token' in response
}

export function logEvents(provider: Provider) {
  provider.on('authorization.success', (ctx: KoaContextWithOIDC, response: unknown) => {
    const log = buildOidcRequestLogger(ctx)
    const containsToken = hasIdToken(response)
    log.auditEvent(AuditEvents.OIDC_AUTHORIZATION_SUCCESS, {
      ...(containsToken ? { idToken: redactValueObjectUnknown(decodeJwt(response.id_token)) } : {}),
    })
  })
  provider.on('authorization.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_AUTHORIZATION_ERROR, { error: err })
  })
  provider.on('end_session.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: end_session.error', { error: err })
  })
  provider.on('grant.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: grant.error', { error: err })
  })
  provider.on('grant.success', (ctx) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_GRANT_SUCCESS)
  })

  provider.on('discovery.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: discovery.error', { error: err })
  })
  provider.on('introspection.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: introspection.error', { error: err })
  })
  provider.on('jwks.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: jwks.error', { error: err })
  })

  provider.on('registration_create.success', (ctx, client) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_REGISTRATION_CREATED, { client })
  })
  provider.on('registration_create.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: registration_create.error', { error: err })
  })
  provider.on('registration_delete.success', (ctx, client) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_REGISTRATION_DELETED, { client })
  })
  provider.on('registration_delete.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: registration_delete.error', { error: err })
  })
  provider.on('registration_read.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: registration_read.error', { error: err })
  })
  provider.on('registration_update.success', (ctx, client) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_REGISTRATION_UPDATED, { client })
  })
  provider.on('registration_update.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: registration_update.error', { error: err })
  })

  provider.on('pushed_authorization_request.success', (ctx) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_PAR_SUCCESS)
  })
  provider.on('pushed_authorization_request.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: pushed_authorization_request.error', { error: err })
  })

  provider.on('backchannel.success', (ctx, client, accountId, sid) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_BACKCHANNEL_SUCCESS, { client, accountId, sid })
  })
  provider.on('backchannel.error', (ctx, err) => {
    const log = buildOidcRequestLogger(ctx)
    log.error('OIDC event: backchannel.error', { error: err })
  })

  provider.on('interaction.ended', (ctx) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_INTERACTION_ENDED)
  })
  provider.on('interaction.started', (ctx) => {
    const log = buildOidcRequestLogger(ctx)
    log.auditEvent(AuditEvents.OIDC_INTERACTION_STARTED)
  })
}
