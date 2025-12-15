import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { instrumentations } from './tracing/instrumentations'

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'VerifiableOrchestration',
  'service.namespace': 'verifiable-orchestration-api',
})

const sdk = new NodeSDK({
  instrumentations,
  traceExporter: new OTLPTraceExporter(),
  logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter()),
  resource,
})

sdk.start()

import './main.api'
