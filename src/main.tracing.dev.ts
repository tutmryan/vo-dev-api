import { Resource } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_NAMESPACE } from '@opentelemetry/semantic-conventions'
import { instrumentations } from './tracing/instrumentations'

const sdk = new NodeSDK({
  instrumentations,
  traceExporter: new OTLPTraceExporter(),
  logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter()),
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'VerifiableOrchestration',
    [SEMRESATTRS_SERVICE_NAMESPACE]: 'verifiable-orchestration-api',
  }),
})

sdk.start()

import './main.api'
