import { createTypedConfig } from '@makerxstudio/node-common/typed-config-factory'
import type { Config } from './schema'
// eslint-disable-next-line no-restricted-imports
import config from 'config'
export default createTypedConfig<Config>(config)
