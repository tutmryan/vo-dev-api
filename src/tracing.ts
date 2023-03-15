import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
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

config.instrumentations.http = { enabled: true }
config.instrumentations.azureSdk = { enabled: true }
config.logInstrumentations.winston = { enabled: true }

const client = new ApplicationInsightsClient(config)

client.getTraceHandler().addInstrumentation(new ExpressInstrumentation())
client.getTraceHandler().addInstrumentation(new WinstonInstrumentation())
client.getTraceHandler().addInstrumentation(new GraphQLInstrumentation())
client.getTraceHandler().addInstrumentation(new TediousInstrumentation())

client.start()
