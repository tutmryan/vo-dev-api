import '../services/__mocks__/blob-storage-container-service'
import { fakeDownloadToDataURL } from './data-url'
export { helper as mockAdminServiceHelper } from '../services/__mocks__/verified-id'
export { helper as mockRequestServiceHelper } from '../services/__mocks__/verified-request'
export const mockDownloadToDataURL = jest.fn(fakeDownloadToDataURL)

export function mockServices() {
  jest.mock('../services/blob-storage-container-service')
  jest.mock('../services/verified-id')
  jest.mock('../util/data-url', () => {
    const originalModule = jest.requireActual('../util/data-url')
    return {
      ...originalModule,
      downloadToDataUrl: mockDownloadToDataURL,
    }
  })
}
