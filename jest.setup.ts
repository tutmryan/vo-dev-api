import { isSqlite } from './src/data/data-source'
import { setup } from './src/test'

export default async (): Promise<void> => {
  console.info(`Environment: NODE_ENV=${process.env.NODE_ENV} isSqlite=${isSqlite}`)
  await setup()
}
