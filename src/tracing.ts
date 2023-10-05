import { BullMQInstrumentation } from '@jenniferplusplus/opentelemetry-instrumentation-bullmq'
import type { ProxyTracerProvider } from '@opentelemetry/api'
import { trace } from '@opentelemetry/api'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis'
import { TediousInstrumentation } from '@opentelemetry/instrumentation-tedious'
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

registerInstrumentations({
  tracerProvider,
  instrumentations: [
    new ExpressInstrumentation(),
    new WinstonInstrumentation(),
    new GraphQLInstrumentation(),
    new TediousInstrumentation(),
    new IORedisInstrumentation(),
    new BullMQInstrumentation(),
  ],
})
