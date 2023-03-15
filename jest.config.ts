import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  rootDir: 'src',
  globalSetup: '<rootDir>/../jest.setup.ts',
  globalTeardown: '<rootDir>/../jest.teardown.ts',
}

export default config
