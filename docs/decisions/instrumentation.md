# Instrumentation

Options:

- OTEL + winston
- AppInsights + winston

Decision: OTEL via [applicationinsights@beta](https://github.com/microsoft/ApplicationInsights-node.js/tree/beta#readme). Reasons:

- Mick has investigated and briefly tested that this ^^^ works.
- Presumably we can leverage [opentelemetry-plugin-mssql](https://www.npmjs.com/package/opentelemetry-plugin-mssql) to have mssql instrumented for free.
- In the past, we've had to wrap mssql for manual basic instrumentation into AppInsights, we don't want to do that.
