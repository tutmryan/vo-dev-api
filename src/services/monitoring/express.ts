import type { Express } from 'express'
import type { ServiceState } from '.'
import { serviceState } from '.'
import { logger } from '../../logger'

export async function addServiceHealthEndpoints(app: Express): Promise<void> {
  // add service health endpoints
  Object.keys(serviceState).forEach((service) => {
    app.get(`/health/services/${service}`, (req, res) => {
      if (serviceState[service as keyof ServiceState]) {
        res.status(200).send('OK').end()
      } else {
        res.status(503).send('Not OK').end()
      }
    })
    logger.info(`Added GET /health/services/${service}`)
  })
}
