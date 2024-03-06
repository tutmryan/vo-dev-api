import { BullMQInstrumentation } from '@jenniferplusplus/opentelemetry-instrumentation-bullmq'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis'
import TediousInstrumentation from '@opentelemetry/instrumentation-tedious'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { WSInstrumentation } from 'opentelemetry-instrumentation-ws'

export const instrumentations = [
  new ExpressInstrumentation(),
  new WinstonInstrumentation(),
  new GraphQLInstrumentation(),
  new WSInstrumentation(),
  new TediousInstrumentation(),
  new IORedisInstrumentation(),
  new BullMQInstrumentation(),
]
