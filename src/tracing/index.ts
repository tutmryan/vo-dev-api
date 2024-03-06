import type { ProxyTracerProvider } from '@opentelemetry/api'
import { trace } from '@opentelemetry/api'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { Resource } from '@opentelemetry/resources'
import type { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_NAMESPACE } from '@opentelemetry/semantic-conventions'
import type { AzureMonitorOpenTelemetryOptions } from 'applicationinsights'
import { useAzureMonitor } from 'applicationinsights'
import { instrumentations } from './instrumentations'

const resource = Resource.EMPTY as any as Required<AzureMonitorOpenTelemetryOptions>['resource'] // type conflict between @opentelemetry/resources and @azure/monitor-opentelemetry
resource.attributes[SEMRESATTRS_SERVICE_NAME] = 'VerifiableOrchestration'
resource.attributes[SEMRESATTRS_SERVICE_NAMESPACE] = 'verifiable-orchestration-api'

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

registerInstrumentations({
  tracerProvider,
  instrumentations,
})
