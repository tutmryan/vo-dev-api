import { ClientSecretCredential, DefaultAzureCredential } from '@azure/identity'
import { LogsIngestionClient, isAggregateLogsUploadError } from '@azure/monitor-ingestion'
import { isLocalDev } from '@makerx/node-common'
import { AuditEventById, UNKNOWN_EVENT_TYPE, UNKNOWN_EVENT_TYPE_ID, type AuditEventTypeId } from '../audit-types'
import { auditLogStreaming, platformTenant } from '../config'
import { logger } from '../logger'

const ruleId = auditLogStreaming.dataCollectionRuleId
const streamName = 'Custom-AuditTraces_CL'
const credential = auditLogStreaming.dataCollectionClientSecret
  ? new ClientSecretCredential(
      platformTenant.tenantId,
      auditLogStreaming.dataCollectionClientId,
      auditLogStreaming.dataCollectionClientSecret,
    ) // Use for local dev and potentially non-Azure hosting
  : new DefaultAzureCredential() // Use Managed Identity when hosted in Azure

const logsIngestionClient = new LogsIngestionClient(auditLogStreaming.dataCollectionEndpoint, credential)

// Changes to this type must be reflected in the Log Analytics workspace custom log definition
// See the log-analytics.bicep file for the custom log definition
type AuditLogEntry = {
  EventTime: string // ISO 8601 timestamp of when the event occurred (distinct from Azure's TimeGenerated which is ingestion time)
  EventTypeId: string // Stable event code (e.g., VO0010) - never changes once assigned
  EventType: string // Semantic event type (e.g., api.graphql.operation) - human readable
  Message: string
  Properties: Record<string, unknown>
}

const createAuditService = () => {
  return {
    log: async (message: string, optionalParams: Record<string, unknown>) => {
      const { eventTypeId, ...properties } = optionalParams

      // Fall back gracefully if eventTypeId is not provided (e.g., from external logging plugins)
      const eventMetadata = eventTypeId ? AuditEventById[eventTypeId as AuditEventTypeId] : undefined
      const eventType = eventMetadata?.eventType ?? UNKNOWN_EVENT_TYPE
      const resolvedEventTypeId = eventTypeId ? (eventTypeId as string) : UNKNOWN_EVENT_TYPE_ID

      const logEntry: AuditLogEntry = {
        EventTime: new Date().toISOString(),
        EventTypeId: resolvedEventTypeId,
        EventType: eventType,
        Message: message,
        Properties: properties,
      }

      if (isLocalDev && !auditLogStreaming.dataCollectionClientSecret) {
        return // Local dev that's not shipping audit logs to a Log Analytics workspace
      }

      try {
        await logsIngestionClient.upload(ruleId, streamName, [logEntry])
      } catch (error) {
        if (isAggregateLogsUploadError(error)) {
          for (const innerError of error.errors) {
            logger.error('Audit log upload failed', { error: innerError })
          }
        } else {
          logger.error('Audit log upload failed', { error })
        }
      }
    },
  }
}

export const auditService = createAuditService()

export type AuditService = ReturnType<typeof createAuditService>
