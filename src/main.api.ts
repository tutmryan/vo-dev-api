import { runApi } from './api'
import { logger } from './logger'

// Allow console logs in this file for startup/shutdown messages
/* eslint-disable no-console */

runApi().catch((error: unknown) => {
  logger.error('API Process - Unhandled error', error)
  console.error('API Process - Unhandled error', error)
  process.exit(1)
})

process.on('exit', (code) => {
  logger.info(`API Process - Exiting with code: ${code}`)
  console.log(`API Process - Exiting with code: ${code}`)
})
process.on('uncaughtException', (error) => {
  logger.error('API Process - Uncaught Exception', { error })
  console.error(`API Process - Uncaught Exception: ${error}`)
})
process.on('unhandledRejection', (reason, promise) => {
  logger.error('API Process - Unhandled Rejection at', { promise, reason })
  console.error(`API Process - Unhandled Rejection at: ${reason}, promise: ${promise}`)
})
