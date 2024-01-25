export const mockCreateContract = jest.fn()
export const mockUpdateContract = jest.fn()
export const mock = jest.mock('../verified-id/admin', () => ({
  VerifiedIdAdminService: jest.fn().mockImplementation(() => ({
    createContract: mockCreateContract,
    updateContract: mockUpdateContract,
  })),
}))
