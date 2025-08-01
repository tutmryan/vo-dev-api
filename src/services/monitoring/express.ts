import type { Express } from 'express'
import { MonitoredServices, serviceErrors } from '.'
import { logger } from '../../logger'

export async function addServiceHealthEndpoints(app: Express): Promise<void> {
  // add service health endpoints
  Object.values(MonitoredServices).forEach((service) => {
    app.get(`/health/services/${service}`, (req, res) => {
      if (serviceErrors[service] === undefined) {
        res.status(200).send('OK').end()
      } else {
        res.status(503).send('Not OK').end()
      }
    })
    logger.info(`Added GET /health/services/${service}`)
  })
}
