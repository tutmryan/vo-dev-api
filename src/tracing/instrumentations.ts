import { BullMQInstrumentation } from '@jenniferplusplus/opentelemetry-instrumentation-bullmq'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql'
import TediousInstrumentation from '@opentelemetry/instrumentation-tedious'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { WSInstrumentation } from 'opentelemetry-instrumentation-ws'

export const instrumentations = [
  new ExpressInstrumentation(),
  new WinstonInstrumentation({
    logHook: (span, record) => {
      // Remove injected fields we don't need
      // See https://github.com/open-telemetry/opentelemetry-js-contrib/blob/2d36152d66adc4e2436994becb3247ec8c4d3b92/plugins/node/opentelemetry-instrumentation-winston/src/instrumentation.ts#L207-L211
      delete record.trace_id
      delete record.span_id
      delete record.trace_flags
    },
  }),
  new GraphQLInstrumentation({
    // Don't create spans for the execution of the default resolver on object properties.
    ignoreTrivialResolveSpans: true,
    // Merge list items into a single element.
    // Example: `users.*.name` instead of `users.0.name`, `users.1.name`
    mergeItems: true,
  }),
  new WSInstrumentation(),
  new TediousInstrumentation(),
  new BullMQInstrumentation(),
  new UndiciInstrumentation(),
]
