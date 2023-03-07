import config from './config'
import { getExpressApp } from './express'
import { logger } from './logger'
import http from 'http'
import { startApolloServer } from './apollo'
import { dataSource } from './data'

export const runApi = async () => {
  logger.info('Initialising express app')
  const app = getExpressApp()

  logger.info('Initialising data-source')
  await dataSource.initialize()

  const port = config.has('server.port') ? config.get('server.port') : 80

  logger.info(`Starting http server`)
  const server = http.createServer(app)
  server.listen(port, () => {
    logger.info(`🚀 Server ready at http://localhost:${port}`)
  })

  logger.info('Initialising Apollo')
  await startApolloServer(app, server)
}
