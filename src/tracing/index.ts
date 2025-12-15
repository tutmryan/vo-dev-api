import type { InstrumentationOptions } from '@azure/monitor-opentelemetry'
import { useAzureMonitor } from '@azure/monitor-opentelemetry'
import type { ProxyTracerProvider } from '@opentelemetry/api'
import { trace } from '@opentelemetry/api'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { resourceFromAttributes } from '@opentelemetry/resources'
import type { NodeTracerConfig, NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { instrumentations } from './instrumentations'
import { RemoveSelect1SpansSampler } from './remove-select1-spans-sampler'

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'API',
  'service.namespace': 'VerifiableOrchestration',
})

type DisabledBuiltinInstrumentations = {
  [name in keyof InstrumentationOptions]: { enabled: false }
}

useAzureMonitor({
  resource,
  instrumentationOptions: {
    azureSdk: { enabled: false },
    mongoDb: { enabled: false },
    mySql: { enabled: false },
    postgreSql: { enabled: false },
    redis: { enabled: false },
    redis4: { enabled: false },
    bunyan: { enabled: false },
    http: { enabled: false },
    winston: { enabled: false },
  } satisfies DisabledBuiltinInstrumentations,
})

const tracerProvider = (trace.getTracerProvider() as ProxyTracerProvider).getDelegate() as NodeTracerProvider

// use RemoveSelect1SpansSampler
const config = (tracerProvider as any)._config as NodeTracerConfig
config.sampler = new RemoveSelect1SpansSampler(config.sampler!)

registerInstrumentations({
  tracerProvider,
  instrumentations,
})

import './metrics-setup'
