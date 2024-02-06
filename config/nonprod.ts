import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  cors: {
    origin: true,
    credentials: true,
    maxAge: 84000,
  },
  platformConsumerApps: {
    '5d988fea-e182-4527-bd3a-a4f743121b33': 'Onboarding Demo API (localdev)',
    'dc8366b4-ba83-48e5-8ab2-9a852a4500c6': 'Onboarding Demo API',
    '682447f2-12b8-4ec1-a78e-fef3bf5e42f5': 'Limited Access Client',
    'a774bb59-1fb3-47c7-bbe3-d666fe3f6ca8': 'Barhead Demo',
    '730966fe-a5f8-4227-b30b-63626a28188f': 'NDIS Demo',
    '8db8c852-e896-496d-9b3b-fd6911836f4e': 'Arpansa Demo',
  },
  identityIssuers: {
    '10b631d3-9e47-49e1-a938-cbd933f0488d': 'voonboardingdemo.onmicrosoft.com',
  },
}

module.exports = config
