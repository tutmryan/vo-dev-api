/**
 * Audit events catalog - source of truth for all audit events.
 *
 * Each event has:
 * - id: Stable code (VO####) - NEVER change once assigned
 * - eventType: Semantic identifier using taxonomy: feature.entity[~qualifier].action[~qualifier]
 *
 * Taxonomy:
 * - feature: Matches src/features directory (e.g., async-issuance, oidc, presentation)
 * - entity: Primary noun/resource (e.g., request, notification, credential, session)
 * - action: Past-tense verb (e.g., created, completed, failed, cancelled)
 * - ~qualifier: Optional specificity (e.g., ~email, ~sms for channel; ~queued, ~failed for state)
 *
 * Format: VO#### where #### is a sequential number
 *
 * Reserved codes:
 * - VO0000 = Unknown/fallback event. Used when eventTypeId is missing or invalid. This can occur when:
 *   - External packages (e.g., @makerx/graphql-apollo-server) log without an eventTypeId
 *   - An invalid/unrecognized eventTypeId is passed
 *   - Logger metadata is not properly configured
 * - VO0001-VO0009 = Reserved for future system-level events
 *
 * IMPORTANT:
 * - Never reuse a code, even if the event is deprecated
 * - Never change a code's meaning
 * - Add new codes within the appropriate group range
 * - Each code maps to a specific call site in the codebase
 */
export const UNKNOWN_EVENT_TYPE_ID = 'VO0000' as const
export const UNKNOWN_EVENT_TYPE = 'system.unknown' as const

export const AuditEvents = {
  // ═══════════════════════════════════════════════════════════════════════════
  // API events
  // ═══════════════════════════════════════════════════════════════════════════
  API_GRAPHQL_OPERATION: { id: 'VO0010', eventType: 'api.graphql.operation' }, // Fallback for unknown operation types
  API_GRAPHQL_QUERY: { id: 'VO0011', eventType: 'api.graphql.query' },
  API_GRAPHQL_MUTATION: { id: 'VO0012', eventType: 'api.graphql.mutation' },
  API_GRAPHQL_SUBSCRIPTION: { id: 'VO0013', eventType: 'api.graphql.subscription' },

  // ═══════════════════════════════════════════════════════════════════════════
  // OIDC Provider events
  // ═══════════════════════════════════════════════════════════════════════════
  OIDC_INTERACTION_STARTED: { id: 'VO0030', eventType: 'oidc.interaction.started' },
  OIDC_INTERACTION_ENDED: { id: 'VO0031', eventType: 'oidc.interaction.ended' },
  OIDC_PAR_SUCCESS: { id: 'VO0032', eventType: 'oidc.par.succeeded' },
  OIDC_AUTHORIZATION_SUCCESS: { id: 'VO0033', eventType: 'oidc.authorization.succeeded' },
  OIDC_AUTHORIZATION_ERROR: { id: 'VO0034', eventType: 'oidc.authorization.failed' },
  OIDC_GRANT_SUCCESS: { id: 'VO0035', eventType: 'oidc.grant.succeeded' },
  OIDC_BACKCHANNEL_SUCCESS: { id: 'VO0036', eventType: 'oidc.backchannel.succeeded' },
  OIDC_REGISTRATION_CREATED: { id: 'VO0037', eventType: 'oidc.registration.created' },
  OIDC_REGISTRATION_UPDATED: { id: 'VO0038', eventType: 'oidc.registration.updated' },
  OIDC_REGISTRATION_DELETED: { id: 'VO0039', eventType: 'oidc.registration.deleted' },
  OIDC_PRESENTATION_CREATED: { id: 'VO0040', eventType: 'oidc.presentation.created' },
  OIDC_SESSION_STARTED: { id: 'VO0041', eventType: 'oidc.session.started' },
  OIDC_SESSION_ENDED: { id: 'VO0042', eventType: 'oidc.session.ended' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Presentation events
  // ═══════════════════════════════════════════════════════════════════════════
  PRESENTATION_REQUEST_CREATED: { id: 'VO0060', eventType: 'presentation.request.created' },
  PRESENTATION_REQUEST_RETRIEVED: { id: 'VO0061', eventType: 'presentation.request.retrieved' },
  PRESENTATION_REQUEST_COMPLETED: { id: 'VO0062', eventType: 'presentation.request.completed' },
  PRESENTATION_REQUEST_FAILED: { id: 'VO0063', eventType: 'presentation.request.failed' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Presentation identity resolution events
  // ═══════════════════════════════════════════════════════════════════════════
  PRESENTATION_IDENTITY_RESOLVER_FAILED: { id: 'VO0071', eventType: 'presentation.identity-resolver.failed' },
  PRESENTATION_IDENTITY_RESOLUTION_FAILED: { id: 'VO0072', eventType: 'presentation.identity-resolution.failed' },
  PRESENTATION_IDENTITY_RESOLVED: { id: 'VO0073', eventType: 'presentation.identity.resolved' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Presentation flow events
  // ═══════════════════════════════════════════════════════════════════════════
  PRESENTATION_FLOW_CREATED: { id: 'VO0064', eventType: 'presentation-flow.created' },
  PRESENTATION_FLOW_CANCELLED: { id: 'VO0065', eventType: 'presentation-flow.cancelled' },
  PRESENTATION_FLOW_SUBMITTED: { id: 'VO0066', eventType: 'presentation-flow.submitted' },
  PRESENTATION_FLOW_TEMPLATE_CREATED: { id: 'VO0067', eventType: 'presentation-flow.template.created' },
  PRESENTATION_FLOW_TEMPLATE_UPDATED: { id: 'VO0068', eventType: 'presentation-flow.template.updated' },
  PRESENTATION_FLOW_TEMPLATE_DELETED: { id: 'VO0069', eventType: 'presentation-flow.template.deleted' },
  PRESENTATION_FLOW_REQUEST_CREATED: { id: 'VO0070', eventType: 'presentation-flow.request.created' },
  PRESENTATION_FLOW_CONTACT_UPDATED: { id: 'VO0074', eventType: 'presentation-flow.contact.updated' },
  PRESENTATION_FLOW_NOTIFICATION_EMAIL_SENT: { id: 'VO0075', eventType: 'presentation-flow.notification~email.sent' },
  PRESENTATION_FLOW_NOTIFICATION_SMS_SENT: { id: 'VO0076', eventType: 'presentation-flow.notification~sms.sent' },
  PRESENTATION_FLOW_NOTIFICATION_EMAIL_FAILED: { id: 'VO0077', eventType: 'presentation-flow.notification~email.failed' },
  PRESENTATION_FLOW_NOTIFICATION_SMS_FAILED: { id: 'VO0078', eventType: 'presentation-flow.notification~sms.failed' },
  PRESENTATION_FLOW_NOTIFICATION_JOB_FAILED: { id: 'VO0079', eventType: 'presentation-flow.notification~job.failed' },
  PRESENTATION_FLOW_NOTIFICATION_EMAIL_STATUS: { id: 'VO0140', eventType: 'presentation-flow.notification~email.status' },
  PRESENTATION_FLOW_NOTIFICATION_SMS_STATUS: { id: 'VO0141', eventType: 'presentation-flow.notification~sms.status' },
  PRESENTATION_FLOW_NOTIFICATION_RESEND_FAILED: { id: 'VO0142', eventType: 'presentation-flow.notification.resend~failed' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Issuance events
  // ═══════════════════════════════════════════════════════════════════════════
  ISSUANCE_REQUEST_CREATED: { id: 'VO0080', eventType: 'issuance.request.created' },
  ISSUANCE_REQUEST_RETRIEVED: { id: 'VO0081', eventType: 'issuance.request.retrieved' },
  ISSUANCE_CREDENTIAL_ISSUED: { id: 'VO0082', eventType: 'issuance.credential.issued' },
  ISSUANCE_CREDENTIAL_REVOKED: { id: 'VO0083', eventType: 'issuance.credential.revoked' },
  ISSUANCE_CREDENTIAL_FAILED: { id: 'VO0084', eventType: 'issuance.credential.failed' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Async issuance events
  // ═══════════════════════════════════════════════════════════════════════════
  ASYNC_ISSUANCE_REQUEST_CREATED: { id: 'VO0100', eventType: 'async-issuance.request.created' },
  ASYNC_ISSUANCE_REQUEST_CLAIMED: { id: 'VO0101', eventType: 'async-issuance.request.claimed' },
  ASYNC_ISSUANCE_CONTACT_FETCHED: { id: 'VO0102', eventType: 'async-issuance.contact.fetched' },
  ASYNC_ISSUANCE_CONTACT_UPDATED: { id: 'VO0103', eventType: 'async-issuance.contact.updated' },
  ASYNC_ISSUANCE_NOTIFICATION_EMAIL_SENT: { id: 'VO0104', eventType: 'async-issuance.notification~email.sent' },
  ASYNC_ISSUANCE_NOTIFICATION_SMS_SENT: { id: 'VO0105', eventType: 'async-issuance.notification~sms.sent' },
  ASYNC_ISSUANCE_NOTIFICATION_RESEND_QUEUED: { id: 'VO0106', eventType: 'async-issuance.notification.resend~queued' },
  ASYNC_ISSUANCE_NOTIFICATION_EMAIL_STATUS: { id: 'VO0107', eventType: 'async-issuance.notification~email.status' },
  ASYNC_ISSUANCE_NOTIFICATION_SMS_STATUS: { id: 'VO0108', eventType: 'async-issuance.notification~sms.status' },
  ASYNC_ISSUANCE_NOTIFICATION_RESEND_FAILED: { id: 'VO0109', eventType: 'async-issuance.notification.resend~failed' },
  ASYNC_ISSUANCE_NOTIFICATION_EMAIL_FAILED: { id: 'VO0110', eventType: 'async-issuance.notification~email.failed' },
  ASYNC_ISSUANCE_NOTIFICATION_SMS_FAILED: { id: 'VO0111', eventType: 'async-issuance.notification~sms.failed' },
  ASYNC_ISSUANCE_NOTIFICATION_JOB_FAILED: { id: 'VO0112', eventType: 'async-issuance.notification~job.failed' },
  ASYNC_ISSUANCE_CANCELLATION_QUEUED: { id: 'VO0113', eventType: 'async-issuance.request.cancelled~queued' },
  ASYNC_ISSUANCE_REQUEST_CANCELLED_COMMAND: { id: 'VO0114', eventType: 'async-issuance.request.cancelled~command' },
  ASYNC_ISSUANCE_REQUEST_CANCELLED_JOB: { id: 'VO0115', eventType: 'async-issuance.request.cancelled~job' },
  ASYNC_ISSUANCE_CANCELLATION_FAILED: { id: 'VO0116', eventType: 'async-issuance.request.cancelled~failed' },

  // ═══════════════════════════════════════════════════════════════════════════
  // Microsoft Entra Temporary Access Pass events
  // ═══════════════════════════════════════════════════════════════════════════
  MICROSOFT_ENTRA_TEMPORARY_ACCESS_PASS_SELF_ISSUED: { id: 'VO0130', eventType: 'microsoft-entra-temporary-access-pass.self-issued' },
  MICROSOFT_ENTRA_TEMPORARY_ACCESS_PASS_SELF_ISSUANCE_FAILED: {
    id: 'VO0131',
    eventType: 'microsoft-entra-temporary-access-pass.issuance-failed',
  },
} as const

/** Type for audit event keys (e.g., 'API_GRAPHQL_OPERATION') */
export type AuditEventKey = keyof typeof AuditEvents

/** Type for a single audit event object */
export type AuditEvent = (typeof AuditEvents)[AuditEventKey]

/** Type for audit event IDs (e.g., 'VO0010') */
export type AuditEventTypeId = (typeof AuditEvents)[AuditEventKey]['id']

/** Type for audit event types (e.g., 'api.graphql.operation') */
export type AuditEventType = (typeof AuditEvents)[AuditEventKey]['eventType']

/** Lookup map from event ID to event metadata */
export const AuditEventById = Object.fromEntries(Object.values(AuditEvents).map((event) => [event.id, event])) as Record<
  AuditEventTypeId,
  { id: AuditEventTypeId; eventType: AuditEventType }
>

/** Maps lowercase word to formatted version. */
const wordFormatMap: Record<string, string> = {
  api: 'API',
  graphql: 'GraphQL',
  id: 'ID',
  oidc: 'OIDC',
  otp: 'OTP',
  par: 'PAR',
  sms: 'SMS',
}

/**
 * Formats an eventType string into a human-readable message.
 * Handles:
 * - Dots (.) as segment separators
 * - Tildes (~) as qualifier separators
 * - Hyphens (-) within segments (e.g., async-issuance)
 * - Known acronyms/words via wordFormatMap
 *
 * @example
 * formatEventTypeAsMessage('oidc.session.ended') // 'OIDC session ended'
 * formatEventTypeAsMessage('api.graphql.operation') // 'API GraphQL operation'
 * formatEventTypeAsMessage('async-issuance.notification~email.failed') // 'Async issuance notification email failed'
 * formatEventTypeAsMessage('async-issuance.request.cancelled~queued') // 'Async issuance request cancelled queued'
 */
export function formatEventTypeAsMessage(eventType: string): string {
  // Split by dots first, then handle tildes and hyphens within each segment

  const formattedString = eventType
    .split('.')
    .flatMap((segment) => segment.split('~')) // Split qualifiers
    .flatMap((segment) => segment.split('-')) // Split hyphenated words
    .map((word) => word.toLowerCase())
    .map((word) => wordFormatMap[word] ?? word)
    .join(' ')

  return `${formattedString.charAt(0).toUpperCase()}${formattedString.slice(1)}`
}
