import { isLocalDev } from '@makerx/node-common'
import http from 'http'
import { startApolloServer } from './apollo'
import { initializeAzurite } from './azurite'
import { apiUrl, server } from './config'
import { dataSource } from './data'
import { getExpressApp } from './express'
import { logger } from './logger'

export const runApi = async () => {
  if (isLocalDev) {
    logger.info('Initialising azurite blob storage')
    await initializeAzurite()
  }

  logger.info('Initialising data-source')
  await dataSource.initialize()

  logger.info('Initialising express app')
  const app = await getExpressApp()

  logger.info('Initialising http server')
  const httpServer = http.createServer(app)

  await startApolloServer(app, httpServer)

  const port = server.port ?? 80
  httpServer.listen(port, () => {
    logger.info(`🚀 Server ready at ${apiUrl}`)
  })
}
