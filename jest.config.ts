import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  rootDir: 'src',
  globalSetup: '<rootDir>/../jest.setup.ts',
  globalTeardown: '<rootDir>/../jest.teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/../jest.setup-after-env.ts'],
  prettierPath: 'prettier-2',
  // GH runners currently have 2 cores. However by default, Jest will use core count - 1,
  // so setting it to 2 will help with performance and memory usage
  ...(process.env.GITHUB_REPOSITORY ? { maxWorkers: 2 } : {}),
}

export default config
