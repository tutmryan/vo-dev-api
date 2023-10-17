import { BullMQInstrumentation } from '@jenniferplusplus/opentelemetry-instrumentation-bullmq'
import type { ProxyTracerProvider } from '@opentelemetry/api'
import { trace } from '@opentelemetry/api'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis'
import { TediousInstrumentation } from '@opentelemetry/instrumentation-tedious'
import type { LogHookFunction } from '@opentelemetry/instrumentation-winston'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { Resource } from '@opentelemetry/resources'
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { useAzureMonitor } from 'applicationinsights'

const resource = Resource.EMPTY
resource.attributes[SemanticResourceAttributes.SERVICE_NAME] = 'VerifiableOrchestration'
resource.attributes[SemanticResourceAttributes.SERVICE_NAMESPACE] = 'verifiable-orchestration-api'

useAzureMonitor({
  resource,
  instrumentationOptions: {
    azureSdk: { enabled: false },
    http: { enabled: true },

    mongoDb: { enabled: false },
    mySql: { enabled: false },
    postgreSql: { enabled: false },
    redis: { enabled: false },
    redis4: { enabled: false },
  },
  logInstrumentationOptions: {
    winston: { enabled: true },
  },
})

const tracerProvider = (trace.getTracerProvider() as ProxyTracerProvider).getDelegate() as NodeTracerProvider

/**
 * AppInsights *seems to* use the `level` property of the record to determine the `SeverityLevel` of the AppInsights log entry.
 * It appears to translate the npm log levels, e.g. verbose becomes 0; info becomes 1; error becomes 2.
 * Unfortunately it also seems to remove the `level` property on ingestion, before the log record becomes `customDimensions` in AppInsights `traces` (and `Properties` in Log Analytics `AppTraces`).
 * I have checked the @opentelemetry/instrumentation-winston source and it does not appear to remove the `level` property or otherwise modify the log record at all.
 * This behaviour prevents us from using the `level` property to filter logs in App Insights or Log Analytics (e.g. `where Properties.level == 'audit'`).
 * To work around this, add a `logLevel` property to the record and set it to the same value as the `level` property.
 * We can then filter logs using the `logLevel` property instead.
 */
const winstonAppInsightsLogHook: LogHookFunction = (span, record: Record<string | symbol, any>) => {
  record['logLevel'] = record.level
}

registerInstrumentations({
  tracerProvider,
  instrumentations: [
    new ExpressInstrumentation(),
    new WinstonInstrumentation({
      logHook: winstonAppInsightsLogHook,
    }),
    new GraphQLInstrumentation(),
    new TediousInstrumentation(),
    new IORedisInstrumentation(),
    new BullMQInstrumentation(),
  ],
})
