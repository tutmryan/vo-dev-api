import { runApi } from './api'
import { logger } from './logger'

runApi().catch((error: unknown) => logger.error('Unhandled error', error))
