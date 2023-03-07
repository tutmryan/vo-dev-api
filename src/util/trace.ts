import type { Span, SpanOptions, Tracer } from '@opentelemetry/api'
import * as otel from '@opentelemetry/api'
import type { Context } from '@opentelemetry/api/build/src/context/types'
import { logger } from '../logger'

interface RethrowErrorHandlingStrategy {
  strategy: 'rethrow'
}

interface DefaultValueErrorHandlingStrategy<T> {
  strategy: 'default-value'
  valueOnError: (() => T) | T
}

type ErrorHandlingStrategy<T> = RethrowErrorHandlingStrategy | DefaultValueErrorHandlingStrategy<T>

interface SpanTracingOptions<T> extends SpanOptions {
  name: string
  context?: Context
  errorHandling: ErrorHandlingStrategy<T>
  failureMessage?: ((err: unknown) => string) | string
}

export function startActiveSpan<T>(
  tracerInstanceOrName: Tracer | string,
  options: SpanTracingOptions<T>,
  fn: (span: Span) => Promise<T> | T,
) {
  const tracer = typeof tracerInstanceOrName === 'string' ? otel.trace.getTracer(tracerInstanceOrName) : tracerInstanceOrName
  const wrappedFn = async (span: Span): Promise<T> => {
    try {
      return await fn(span)
    } catch (error: unknown) {
      const message =
        options.failureMessage !== undefined
          ? typeof options.failureMessage === 'function'
            ? options.failureMessage(error)
            : options.failureMessage
          : `${error}`
      logger.error(message, error)
      span.setStatus({
        code: otel.SpanStatusCode.ERROR,
        message: message,
      })
      if (error instanceof Error) {
        span.recordException(error)
      } else {
        span.recordException(JSON.stringify(error))
      }
      if (options.errorHandling.strategy === 'rethrow') {
        throw error
      } else {
        if (options.errorHandling.valueOnError instanceof Function) {
          return options.errorHandling.valueOnError()
        } else {
          return options.errorHandling.valueOnError
        }
      }
    } finally {
      span.end()
    }
  }
  if (options.context) {
    return tracer.startActiveSpan(options.name, options, options.context, wrappedFn)
  } else {
    return tracer.startActiveSpan(options.name, options, wrappedFn)
  }
}
