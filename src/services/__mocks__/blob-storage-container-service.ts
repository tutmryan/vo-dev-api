export const mockDeleteIfExists = jest.fn()
export const mock = jest.mock('../blob-storage-container-service', () => ({
  BlobStorageContainerService: jest.fn().mockImplementation(() => ({
    deleteIfExists: mockDeleteIfExists,
  })),
}))
