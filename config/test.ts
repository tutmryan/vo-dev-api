import type { DeepPartial } from 'typeorm'
import type { Config } from '../src/config'

const config: DeepPartial<Config> = {
  database: {
    database: 'VerifiedOrchestration_test',
    host: 'localhost',
    username: 'api_user',
    password: '7o}R~=XA1jmz!-aHQ^pA',
    logging: false,
  },
}

module.exports = config
