import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

// refer to: https://github.com/VerifiedOrchestration/verified-orchestration-api/issues/214

const config: DeepPartial<Config> = {
  cors: {
    origin: [],
  },
}

module.exports = config
