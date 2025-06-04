import { metrics } from '@opentelemetry/api'
import { getServiceStatus, monitoredServices } from '../services/monitoring'

const meter = metrics.getMeter('verifiable-orchestration-meter')

Object.values(monitoredServices).forEach((serviceName) => {
  const reportedServiceName = `${serviceName}-service`
  const gauge = meter.createObservableGauge(reportedServiceName, {
    description: `A metric used to indicate if the ${serviceName} is down. 0 = DOWN, 1 = UP`,
  })

  gauge.addCallback((observableResult) => {
    observableResult.observe(getServiceStatus(serviceName) ? 1 : 0, {
      service: 'external-services',
      monitored: reportedServiceName,
    })
  })
})
