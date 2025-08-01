import { metrics } from '@opentelemetry/api'
import { MonitoredServices, serviceErrors } from '../services/monitoring'

const meter = metrics.getMeter('verifiable-orchestration-meter')

Object.values(MonitoredServices).forEach((serviceName) => {
  const reportedServiceName = `${serviceName}-service`
  const gauge = meter.createObservableGauge(reportedServiceName, {
    description: `A metric used to report if the ${serviceName} is down. 1 = DOWN`,
  })

  gauge.addCallback((observableResult) => {
    observableResult.observe(serviceErrors[serviceName] === undefined ? 0 : 1, {
      service: 'external-services',
      monitored: reportedServiceName,
    })
  })
})
