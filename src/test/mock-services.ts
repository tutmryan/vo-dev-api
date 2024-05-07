import '../services/__mocks__/blob-storage-container-service'
import { fakeDownloadToDataURL } from './data-url'
export { mock as MockAdminService, mockCreateContract, mockUpdateContract } from '../services/__mocks__/verified-id'
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
