import type { Config } from '@jest/types'

// Tests can't be guaranteed to run in a non-test environment
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests should only be run in test environment')
}

// Tests will break if the .env values are loaded into process
if (process.env.SMS_SECRET) {
  throw new Error('Tests must not be run with the .env vars loaded into process')
}

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  rootDir: 'src',
  globalSetup: '<rootDir>/../jest.setup.ts',
  globalTeardown: '<rootDir>/../jest.teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/../jest.setup-after-env.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  prettierPath: 'prettier-2',
  // Transform ESM-only packages in node_modules so Jest can handle them
  transformIgnorePatterns: ['node_modules/(?!(cbor2|@cto\\.af)/)'],
  // Include transform for JS files from ESM packages
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'ts-jest',
  },
  // GH runners currently have 2 cores. However by default, Jest will use core count - 1,
  // so setting it to 2 will help with performance and memory usage
  ...(process.env.GITHUB_REPOSITORY ? { maxWorkers: 2 } : {}),
}

export default config
