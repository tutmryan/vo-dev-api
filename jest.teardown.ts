import { teardown } from './src/test'

export default async (): Promise<void> => {
  await teardown()
}
