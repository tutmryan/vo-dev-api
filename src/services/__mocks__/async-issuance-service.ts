const mockUploadAsyncIssuance = jest.fn()
const mockDownloadAsyncIssuance = jest.fn()
const mockDeleteAsyncIssuanceIfExists = jest.fn()

export const mock = jest.mock('../async-issuance-service', () => ({
  AsyncIssuanceService: jest.fn().mockImplementation(() => ({
    uploadAsyncIssuance: mockUploadAsyncIssuance,
    downloadAsyncIssuance: mockDownloadAsyncIssuance,
    deleteAsyncIssuanceIfExists: mockDeleteAsyncIssuanceIfExists,
  })),
}))

export const helper = {
  clearAllMocks: mock.clearAllMocks,
  uploadAsyncIssuance: {
    mock: mockUploadAsyncIssuance,
  },
  downloadAsyncIssuance: {
    mock: mockDownloadAsyncIssuance,
  },
  deleteAsyncIssuanceIfExists: {
    mock: mockDeleteAsyncIssuanceIfExists,
  },
}
