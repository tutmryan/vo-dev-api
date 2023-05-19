import http from 'http'
import { startApolloServer } from './apollo'
import config from './config'
import { dataSource } from './data'
import { getExpressApp } from './express'
import { logger } from './logger'

export const runApi = async () => {
  logger.info('Initialising express app')
  const app = getExpressApp()

  logger.info('Initialising data-source')
  await dataSource.initialize()

  logger.info('Initialising http server')
  const httpServer = http.createServer(app)

  await startApolloServer(app, httpServer)

  const port = config.has('server.port') ? config.get('server.port') : 80
  httpServer.listen(port, () => {
    logger.info(`🚀 Server ready at http://localhost:${port}`)
  })
}
