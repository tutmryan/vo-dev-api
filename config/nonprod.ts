import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  cors: {
    origin: true,
    credentials: true,
    maxAge: 84000,
  },
}

module.exports = config
