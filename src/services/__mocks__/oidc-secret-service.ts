import { createClientSecretServiceMock } from './client-secret-service-mocks'

export const { helper } = createClientSecretServiceMock('../oidc-secret-service', 'createOidcSecretService')
