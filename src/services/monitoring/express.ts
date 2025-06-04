import type { Express } from 'express'
import { getServiceStatus, monitoredServices } from '.'
import { logger } from '../../logger'

export async function addServiceHealthEndpoints(app: Express): Promise<void> {
  // add service health endpoints
  Object.values(monitoredServices).forEach((service) => {
    app.get(`/health/services/${service}`, (req, res) => {
      if (getServiceStatus(service)) {
        res.status(200).send('OK').end()
      } else {
        res.status(503).send('Not OK').end()
      }
    })
    logger.info(`Added GET /health/services/${service}`)
  })
}
