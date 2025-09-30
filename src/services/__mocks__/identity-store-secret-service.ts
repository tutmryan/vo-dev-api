import { createClientSecretServiceMock } from './client-secret-service-mocks'

export const { helper } = createClientSecretServiceMock('../identity-store-secret-service', 'createIdentityStoreSecretService')
