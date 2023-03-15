import { config } from 'dotenv'
import { setup } from './src/test'

export default async (): Promise<void> => {
  config()
  await setup()
}
