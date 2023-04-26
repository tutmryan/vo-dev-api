import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis'
import { TediousInstrumentation } from '@opentelemetry/instrumentation-tedious'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { ApplicationInsightsClient, ApplicationInsightsConfig } from 'applicationinsights'

const resource = Resource.EMPTY
resource.attributes[SemanticResourceAttributes.SERVICE_NAME] = 'VerifiableOrchestration'
resource.attributes[SemanticResourceAttributes.SERVICE_NAMESPACE] = 'verifiable-orchestration-api'

const config = new ApplicationInsightsConfig()
config.resource = resource

/**
 * Disabling this for now as it shows 1000s of failed requests on the App Insights dashboard.
 * See https://github.com/microsoft/ApplicationInsights-node.js/issues/1123
 */
config.enableAutoCollectStandardMetrics = false

config.instrumentations.http = { enabled: true }
config.instrumentations.azureSdk = { enabled: true }
config.logInstrumentations.winston = { enabled: true }

const client = new ApplicationInsightsClient(config)

client.getTraceHandler().addInstrumentation(new ExpressInstrumentation())
client.getTraceHandler().addInstrumentation(new WinstonInstrumentation())
client.getTraceHandler().addInstrumentation(new GraphQLInstrumentation())
client.getTraceHandler().addInstrumentation(new TediousInstrumentation())
client.getTraceHandler().addInstrumentation(new IORedisInstrumentation())

client.start()
