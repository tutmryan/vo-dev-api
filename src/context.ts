import type { GraphQLContext as GraphQLContextBase, RequestInfo } from '@makerxstudio/graphql-core'
import { createContextFactory } from '@makerxstudio/graphql-core'
import type { DataSource } from 'typeorm'
import config from './config'
import { logger } from './logger'
import type { Services } from './services'
import { createServices } from './services'
import { dataSource } from './data'

export type BaseContext = GraphQLContextBase<typeof logger, RequestInfo>
export type GraphQLContext = BaseContext & {
  dataSource: DataSource
  services: Services
}

export const createContext = createContextFactory<GraphQLContext>({
  claimsToLog: config.get('logging.userClaimsToLog'),
  requestInfoToLog: config.get('logging.requestInfoToLog'),
  requestLogger: (requestMetadata) => logger.child(requestMetadata),
  augmentContext: (context) => {
    const services = createServices(context)
    return { services, dataSource }
  },
})
