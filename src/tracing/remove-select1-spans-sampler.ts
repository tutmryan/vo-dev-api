import type { Attributes, Context, Link, SpanKind } from '@opentelemetry/api'
import type { Sampler, SamplingResult } from '@opentelemetry/sdk-trace-base'
import { SamplingDecision } from '@opentelemetry/sdk-trace-base'
import { SEMATTRS_DB_STATEMENT, SEMATTRS_DB_SYSTEM } from '@opentelemetry/semantic-conventions'

/**
 * This sampler prevents SQL spans to be recorded for the "SELECT 1" queries.
 *
 * These queries come from the mssql library, which, before each query, takes a connection from the pool
 * and issues this query to validate the connection is healthy.
 * If it's not, then the connection is discarded and a new one is either taken from the pool or created.
 * This process is transparent to us, and provides some robustness, so we want to keep it in.
 */
export class RemoveSelect1SpansSampler implements Sampler {
  constructor(private inner: Sampler) {}
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[],
  ): SamplingResult {
    const isSqlSpan = attributes[SEMATTRS_DB_SYSTEM] !== 'undefined'
    if (isSqlSpan) {
      // Query comes from mssql
      // See https://github.com/tediousjs/node-mssql/blob/d4a976c91c1d67b0f8dbc29a88b15a7b19bfb77b/lib/tedious/connection-pool.js#L119-L129
      const dbStatement = attributes[SEMATTRS_DB_STATEMENT]
      if (dbStatement && typeof dbStatement === 'string' && dbStatement === 'SELECT 1;') {
        return {
          decision: SamplingDecision.NOT_RECORD,
        }
      }
    }

    return this.inner.shouldSample(context, traceId, spanName, spanKind, attributes, links)
  }
  toString(): string {
    return `RemoveSelect1SpansSampler > ${this.inner.toString()}`
  }
}
